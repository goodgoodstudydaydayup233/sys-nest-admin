import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../core/config/config.service';
import { AuthCacheService } from '../auth-cache.service';

/**
 * JWT 策略
 * @description 校验 access token 有效性，并检查 token 黑名单（登出后立即失效）
 *
 * @黑名单校验
 * 用户登出时会将 token 加入 Redis 黑名单（token:blacklist:{token}）。
 * 每次请求校验时从 request 提取原始 token，查询是否在黑名单中。
 * 若在黑名单中则拒绝访问，实现 token 主动失效。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: AppConfigService,
    private authCacheService: AuthCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.secret,
      // 将 request 传入 validate 回调，用于提取原始 token 检查黑名单
      passReqToCallback: true,
    });
  }

  /**
   * 校验 token
   * @param request 原始请求对象（passReqToCallback: true）
   * @param payload JWT 解码后的 payload
   * @returns 用户信息挂载到 req.user
   */
  async validate(request: any, payload: any) {
    // 提取原始 token，检查是否在黑名单中（登出后立即失效）
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (token) {
      const isBlacklisted = await this.authCacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token已失效');
      }
    }
    return { id: payload.sub, username: payload.username };
  }
}
