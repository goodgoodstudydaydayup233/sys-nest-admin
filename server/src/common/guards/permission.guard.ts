import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfigService } from '../../core/config/config.service';
import { AuthCacheService } from '../../modules/auth/auth-cache.service';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodeEnum } from '../enums/error-code.enum';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: AppConfigService,
    private authCacheService: AuthCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { url } = request;

    // 检查白名单
    if (this.isWhitelist(url)) {
      return true;
    }

    // 获取用户信息
    const user = request.user;
    if (!user) {
      throw new BusinessException('未登录', ErrorCodeEnum.UNAUTHORIZED);
    }

    // 从Redis获取用户缓存信息
    const cachedUser = await this.authCacheService.getUserCache(user.id);
    if (!cachedUser) {
      throw new BusinessException('Token已过期，请重新登录', ErrorCodeEnum.TOKEN_EXPIRED);
    }

    // 将缓存的用户信息挂载到request
    request.userInfo = cachedUser;

    if (this.isSuperAdmin(cachedUser.username)) {
      return true;
    }

    // 检查角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) =>
        cachedUser.roles?.some((r) => r.name === role),
      );
      if (!hasRole) {
        throw new BusinessException('没有角色权限', ErrorCodeEnum.NO_PERMISSION);
      }
    }

    // 检查权限标识
    const requiredPermission = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (requiredPermission) {
      const hasPermission = cachedUser.permissions?.includes(requiredPermission);
      if (!hasPermission) {
        throw new BusinessException('没有操作权限', ErrorCodeEnum.NO_PERMISSION);
      }
    }

    return true;
  }

  private isSuperAdmin(username: string): boolean {
    return username === this.configService.app.admin;
  }

  private isWhitelist(url: string): boolean {
    const { paths, prefixes } = this.configService.whitelist;

    // 检查完整路径
    if (paths.some((path) => url === path || url.startsWith(path + '?'))) {
      return true;
    }

    // 检查前缀
    if (prefixes.some((prefix) => url.startsWith(prefix))) {
      return true;
    }

    return false;
  }
}
