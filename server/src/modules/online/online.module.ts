import { Module } from '@nestjs/common';
import { OnlineService } from './online.service';
import { OnlineController } from './online.controller';
import { AuthCacheModule } from '../auth/auth-cache.module';

/**
 * 在线用户模块
 * @description 提供在线用户监控能力，依赖 AuthCacheModule 访问 Redis 在线记录与 token 黑名单
 */
@Module({
  imports: [AuthCacheModule],
  controllers: [OnlineController],
  providers: [OnlineService],
})
export class OnlineModule {}
