import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

/**
 * 限流计数器结果
 * @description allowed=true 表示放行；allowed=false 表示已触发限流
 */
export interface RateLimitResult {
  /** 是否允许通过 */
  allowed: boolean;
  /** 当前时间窗口内已请求次数 */
  count: number;
  /** 时间窗口内允许的最大次数 */
  limit: number;
  /** 时间窗口剩余秒数 */
  ttl: number;
}

/**
 * 限流服务
 * @description 基于 Redis + Lua 脚本实现的原子性限流计数器。
 *
 * 实现原理：
 * 1. Lua 脚本在 Redis 单线程中原子执行，避免并发下的计数错误
 * 2. 首次请求：INCR 计数为 1，并 EXPIRE 设置过期时间
 * 3. 后续请求：INCR 计数递增，若超过阈值返回 0（拒绝），否则返回 1（放行）
 *
 * @使用示例
 * ```ts
 * const result = await rateLimiterService.check('rate_limit:ip:127.0.0.1', 60, 100);
 * if (!result.allowed) {
 *   throw new BusinessException('请求过于频繁', ErrorCodeEnum.RATE_LIMIT_EXCEEDED);
 * }
 * ```
 */
@Injectable()
export class RateLimiterService {
  /** Lua 脚本 SHA 缓存，避免每次请求都传输脚本 */
  private scriptSha: string | null = null;

  /**
   * 限流 Lua 脚本
   * KEYS[1] = 限流 key
   * ARGV[1] = 最大请求次数
   * ARGV[2] = 时间窗口（秒）
   *
   * 返回值（数组）：
   * [1] = 是否放行（1=放行，0=拒绝）
   * [2] = 当前计数
   * [3] = 剩余 TTL（秒）
   */
  private static readonly LUA_SCRIPT = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])

    local current = redis.call('INCR', key)
    if current == 1 then
      redis.call('EXPIRE', key, window)
      return {1, current, window}
    end

    local ttl = redis.call('TTL', key)
    if current > limit then
      return {0, current, ttl}
    end
    return {1, current, ttl}
  `;

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * 检查是否允许通过
   * @param key 限流 key（由调用方按维度组装，如 `rate_limit:ip:127.0.0.1`）
   * @param limit 最大请求次数
   * @param window 时间窗口（秒）
   * @returns 限流结果
   */
  async check(key: string, limit: number, window: number): Promise<RateLimitResult> {
    // 首次调用时加载 Lua 脚本并缓存 SHA
    if (!this.scriptSha) {
      this.scriptSha = (await this.redis.script(
        'LOAD',
        RateLimiterService.LUA_SCRIPT,
      )) as string;
    }

    // 通过 EVALSHA 执行缓存的脚本（减少网络传输）
    const result = (await this.redis.evalsha(
      this.scriptSha,
      1,
      key,
      limit,
      window,
    )) as number[];

    return {
      allowed: result[0] === 1,
      count: result[1],
      limit,
      ttl: result[2],
    };
  }

  /**
   * 重置指定 key 的计数
   * @description 用于测试或手动解除限流
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
