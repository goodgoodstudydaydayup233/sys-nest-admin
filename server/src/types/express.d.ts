import { UserInfoDto } from '../common/dto/user-info.dto';

/**
 * 扩展 Express Request 接口
 * @description 为 NestJS 的 @Req() 装饰器提供类型安全支持
 *
 * - user: JWT passport 挂载的认证用户（含 id/username）
 * - userInfo: PermissionGuard 从 Redis 读取并挂载的完整用户信息
 *
 * @example
 * // controller 中使用
 * import { Request } from 'express';
 *
 * @Post()
 * async create(@Body() dto: CreateDto, @Req() req: Request): Promise<void> {
 *   await this.service.create(dto, req.userInfo?.username);
 * }
 */
declare module 'express' {
  interface Request {
    user?: { id: number; username: string };
    userInfo?: UserInfoDto;
  }
}
