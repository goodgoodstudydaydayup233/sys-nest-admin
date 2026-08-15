import { Module, Global } from '@nestjs/common';
import { AuthCacheService } from './auth-cache.service';

/**
 * 认证缓存模块
 * @description 提供用户信息缓存 / Token 黑名单 / 在线用户等缓存能力。
 * 标记为 @Global：角色、菜单、站内信等模块在权限变更 / 消息推送时需要依赖本服务，避免重复引入。
 */
@Global()
@Module({
  providers: [AuthCacheService],
  exports: [AuthCacheService],
})
export class AuthCacheModule {}
