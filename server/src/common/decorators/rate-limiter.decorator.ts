import { SetMetadata } from '@nestjs/common';
import { RateLimitType } from '../enums/rate-limit-type.enum';

/**
 * @RateLimiter 装饰器元数据 key
 */
export const RATE_LIMITER_METADATA_KEY = 'rate-limiter:metadata';

/**
 * @RateLimiter 装饰器元数据结构
 */
export interface RateLimiterMetadata {
  /** 时间窗口（秒） */
  time: number;
  /** 时间窗口内允许的最大请求次数 */
  count: number;
  /** 限流维度 */
  limitType: RateLimitType;
}

/**
 * 限流装饰器
 * @description 标注在 Controller 方法上，覆盖全局默认限流配置。
 * 由全局 RateLimitInterceptor 读取元数据并执行限流。
 *
 * @param time 时间窗口（秒），默认 60
 * @param count 时间窗口内允许的最大请求次数，默认 100
 * @param limitType 限流维度，默认 DEFAULT（按"接口 + IP"）
 *
 * @使用示例
 * ```ts
 * // 登录接口：60 秒内同一 IP 最多 5 次
 * @RateLimiter(60, 5, RateLimitType.IP)
 * @Post('login')
 * async login() { ... }
 *
 * // 用户接口：60 秒内同一用户最多 10 次
 * @RateLimiter(60, 10, RateLimitType.USER)
 * @Get('list')
 * async list() { ... }
 * ```
 */
export const RateLimiter = (
  time: number = 60,
  count: number = 100,
  limitType: RateLimitType = RateLimitType.DEFAULT,
) =>
  SetMetadata(RATE_LIMITER_METADATA_KEY, {
    time,
    count,
    limitType,
  } as RateLimiterMetadata);
