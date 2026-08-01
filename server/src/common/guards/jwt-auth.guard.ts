import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodeEnum } from '../enums/error-code.enum';
import { AppConfigService } from '../../core/config/config.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private static configService: AppConfigService;

  static setConfigService(configService: AppConfigService) {
    JwtAuthGuard.configService = configService;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { url } = request;

    // 检查白名单，白名单内的路由跳过JWT认证
    if (JwtAuthGuard.configService && this.isWhitelist(url)) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new BusinessException('Token已过期或无效', ErrorCodeEnum.TOKEN_EXPIRED);
    }
    return user;
  }

  private isWhitelist(url: string): boolean {
    const { paths, prefixes } = JwtAuthGuard.configService.whitelist;

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
