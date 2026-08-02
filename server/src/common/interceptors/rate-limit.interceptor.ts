import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfigService } from '../../core/config/config.service';
import { RateLimiterService } from '../services/rate-limiter.service';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodeEnum } from '../enums/error-code.enum';
import { RateLimitType } from '../enums/rate-limit-type.enum';
import {
  RATE_LIMITER_METADATA_KEY,
  RateLimiterMetadata,
} from '../decorators/rate-limiter.decorator';

/**
 * 限流全局拦截器
 * @description 基于 Redis + Lua 脚本实现的三层限流策略。
 *
 * 限流策略（按检查顺序）：
 * 0. **全局总请求数限流**（第一层，最先检查）
 *    - key: `rate_limit:global`（固定 key，不分 IP、不分接口）
 *    - 维度：服务器在时间窗口内接收的总请求数
 *    - 配置：rateLimit.global.time / rateLimit.global.count
 *    - 目的：保护服务器整体 QPS，防止大量分布式 IP 压垮服务
 *
 * 1. **单 IP 全局限流**（第二层）
 *    - key: `rate_limit:ip:{ip}`
 *    - 维度：单个 IP 在时间窗口内对所有接口的总请求数
 *    - 配置：rateLimit.ip.time / rateLimit.ip.count
 *
 * 2. **接口 + IP 限流**（第三层，默认）
 *    - key: `rate_limit:default:{ip}:{method}:{path}`
 *    - 维度：单个 IP 对单个接口的请求数
 *    - 配置：rateLimit.default.time / rateLimit.default.count
 *    - 覆盖：方法上标注 @RateLimiter 装饰器可覆盖默认配置
 *
 * 限流维度（@RateLimiter 装饰器指定）：
 * - DEFAULT：按"接口 + IP"限流
 * - IP：按"IP"限流（与单 IP 全局限流叠加）
 * - USER：按"用户 + 接口"限流（需登录，未登录则降级为 DEFAULT）
 *
 * 触发限流时抛出 BusinessException(9001)，返回"请求过于频繁，请稍候再试"。
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly rateLimiterService: RateLimiterService,
    private readonly configService: AppConfigService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const config = this.configService.rateLimit;

    // 限流未启用，直接放行
    if (!config.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const method = request.method;
    const path = request.path;

    // 0. 全局总请求数限流（第一层，保护服务器整体 QPS）
    const globalKey = 'rate_limit:global';
    const globalResult = await this.rateLimiterService.check(
      globalKey,
      config.global.count,
      config.global.time,
    );
    if (!globalResult.allowed) {
      throw new BusinessException(
        `当前访问量过大，请稍候再试（${config.global.time}秒内最多请求${config.global.count}次）`,
        ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
      );
    }

    // 1. 单 IP 全局限流（第二层，所有接口共享额度）
    const ipKey = `rate_limit:ip:${ip}`;
    const ipResult = await this.rateLimiterService.check(
      ipKey,
      config.ip.count,
      config.ip.time,
    );
    if (!ipResult.allowed) {
      throw new BusinessException(
        `请求过于频繁，请稍候再试（${config.ip.time}秒内最多请求${config.ip.count}次）`,
        ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
      );
    }

    // 2. 读取 @RateLimiter 装饰器配置（未标注则使用默认配置）
    const metadata = this.reflector.getAllAndOverride<RateLimiterMetadata>(
      RATE_LIMITER_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limitTime = metadata?.time ?? config.default.time;
    const limitCount = metadata?.count ?? config.default.count;
    const limitType = metadata?.limitType ?? RateLimitType.DEFAULT;

    // 3. 按 limitType 生成对应的限流 key
    let dimensionKey: string;
    switch (limitType) {
      case RateLimitType.IP:
        // 纯 IP 维度（与单 IP 全局限流 key 不同，此处按装饰器配置的时间窗口/次数）
        dimensionKey = `rate_limit:ip_custom:${ip}`;
        break;
      case RateLimitType.USER:
        // 用户维度：需登录，未登录则降级为 DEFAULT
        if (request.user?.id) {
          dimensionKey = `rate_limit:user:${request.user.id}:${method}:${path}`;
        } else {
          dimensionKey = `rate_limit:default:${ip}:${method}:${path}`;
        }
        break;
      case RateLimitType.DEFAULT:
      default:
        // 默认维度：接口 + IP
        dimensionKey = `rate_limit:default:${ip}:${method}:${path}`;
        break;
    }

    // 4. 执行维度限流检查
    const dimensionResult = await this.rateLimiterService.check(
      dimensionKey,
      limitCount,
      limitTime,
    );
    if (!dimensionResult.allowed) {
      throw new BusinessException(
        `请求过于频繁，请稍候再试（${limitTime}秒内最多请求${limitCount}次）`,
        ErrorCodeEnum.RATE_LIMIT_EXCEEDED,
      );
    }

    return next.handle();
  }

  /**
   * 获取客户端真实 IP
   * @description 优先从 X-Forwarded-For / X-Real-IP 头取（反向代理场景）
   */
  private getClientIp(request: Request): string {
    const headers = request.headers;
    const xForwardedFor = headers['x-forwarded-for'];
    const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    const xRealIp = headers['x-real-ip'];
    const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    return forwarded?.split(',')[0]?.trim() || realIp || request.ip || 'unknown';
  }
}
