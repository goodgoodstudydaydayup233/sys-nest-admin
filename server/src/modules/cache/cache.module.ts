import { Module } from '@nestjs/common';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

/**
 * 缓存监控模块
 * @description 提供 Redis 信息查询与 key 管理
 * @依赖 RedisService 由 core/redis 模块全局提供
 */
@Module({
  controllers: [CacheController],
  providers: [CacheService],
})
export class CacheModule {}
