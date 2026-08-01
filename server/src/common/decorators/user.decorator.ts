import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前登录用户信息装饰器
 *
 * 前置条件：请求需经过 JwtAuthGuard + PermissionGuard，
 * PermissionGuard 会从 Redis 读取完整用户信息挂载到 request.userInfo。
 *
 * @example
 * ```typescript
 * // 获取完整用户信息
 * @User() user: any
 *
 * // 获取指定属性
 * @User('username') username: string
 * @User('id') userId: number
 * ```
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userInfo = request.userInfo;
    return data ? userInfo?.[data] : userInfo;
  },
);
