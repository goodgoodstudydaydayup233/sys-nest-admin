import { Module, Global } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';

/**
 * 限流模块
 * @description 全局模块，提供 RateLimiterService 供 RateLimitInterceptor 使用。
 *
 * 依赖：@nestjs-modules/ioredis 提供的 Redis 实例（由 AppConfigRedisModule 全局导出）
 */
@Global()
@Module({
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
