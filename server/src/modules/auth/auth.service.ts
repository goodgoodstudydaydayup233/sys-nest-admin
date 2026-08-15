import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserService } from '../user/user.service';
import { CaptchaService } from '../captcha/captcha.service';
import { AuthCacheService } from './auth-cache.service';
import { ConfigService } from '../config/config.service';
import { AppConfigService } from '../../core/config/config.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';
import { MenuRepository } from '../menu/menu.repository';
import { buildMenus } from '../../common/utils/build-menus';
import { LoginLogService } from '../log/login-log.service';
import { parseUserAgent } from '../../common/utils/parse-user-agent';
import { UserInfoDto } from '../../common/dto/user-info.dto';
import { User } from '../user/entities/user.entity';
import { Menu } from '../menu/entities/menu.entity';
import * as bcrypt from 'bcrypt';

const SUPER_ADMIN_USERNAME = 'admin';

/** JWT 解码后的载荷结构 */
interface JwtPayload {
  sub: number;
  username: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private captchaService: CaptchaService,
    private authCacheService: AuthCacheService,
    private configService: ConfigService,
    private appConfigService: AppConfigService,
    private menuRepository: MenuRepository,
    private loginLogService: LoginLogService,
  ) {}

  async login(username: string, password: string, captcha?: string, captchaKey?: string, req?: Request) {
    // 提取请求信息，用于登录日志记录
    const ip = this.getClientIp(req);
    const userAgent = req?.headers?.['user-agent'] || '';
    const { browser, os } = parseUserAgent(userAgent);

    try {
      // 读取登录相关配置：验证码开关、最大重试次数、锁定时间（分钟）
      const captchaEnabled = await this.configService.getValueByKey('sys.login.captchaEnabled');
      const needCaptcha = captchaEnabled !== 'false';
      const maxRetryCount = parseInt((await this.configService.getValueByKey('sys.login.maxRetryCount')) || '5', 10);
      const lockTimeMin = parseInt((await this.configService.getValueByKey('sys.login.lockTime')) || '10', 10);
      const lockTimeSec = lockTimeMin * 60;

      // 检查用户是否被锁定（在验证码之前，避免锁定期间仍消耗验证码）
      if (await this.authCacheService.isUserLocked(username)) {
        const remainSec = await this.authCacheService.getLockTTL(username);
        const remainMin = Math.ceil(remainSec / 60);
        throw new BusinessException(`账号已锁定，请${remainMin}分钟后重试`, ErrorCodeEnum.USER_DISABLED);
      }

      // 验证验证码
      if (needCaptcha) {
        if (!captcha || !captchaKey) {
          throw new BusinessException('验证码不能为空', ErrorCodeEnum.CAPTCHA_ERROR);
        }
        const isValid = await this.captchaService.verify(captchaKey, captcha);
        if (!isValid) {
          throw new BusinessException('验证码错误', ErrorCodeEnum.CAPTCHA_ERROR);
        }
      }

      // 查找用户
      const user = await this.userService.findByUsername(username);
      if (!user) {
        throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // 密码错误：递增失败计数器，达到阈值则锁定
        const retryCount = await this.authCacheService.incrLoginRetryCount(username, lockTimeSec);
        if (retryCount >= maxRetryCount) {
          await this.authCacheService.lockUser(username, lockTimeSec);
          throw new BusinessException(
            `密码错误次数已达上限(${maxRetryCount}次)，账号已锁定${lockTimeMin}分钟`,
            ErrorCodeEnum.USER_PASSWORD_ERROR,
          );
        }
        const remaining = maxRetryCount - retryCount;
        throw new BusinessException(`密码错误，剩余尝试次数${remaining}次`, ErrorCodeEnum.USER_PASSWORD_ERROR);
      }

      // 检查用户状态
      if (user.status === '0') {
        throw new BusinessException('用户已被禁用', ErrorCodeEnum.USER_DISABLED);
      }

      // 登录成功：清除失败计数器
      await this.authCacheService.clearLoginRetryCount(username);

      // 生成token
      const tokens = await this.generateTokens(user);

      // 构建用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        roles:
          user.roles?.map((role) => ({
            id: role.id,
            name: role.name,
          })) || [],
        permissions: this.extractPermissions(user),
      };

      // 将用户信息存入Redis
      await this.authCacheService.setUserCache(user.id, userInfo);

      // 记录在线用户（按 token 维度，TTL 为 access token 剩余有效期）
      await this.recordOnlineUser(tokens.accessToken, user, { ip, browser, os });

      // 记录登录成功日志
      await this.loginLogService.asyncCreate({
        userName: username,
        ipaddr: ip,
        browser,
        os,
        status: '0',
        msg: '登录成功',
      });

      return tokens;
    } catch (error) {
      // 记录登录失败日志（异常原因）
      const msg = error instanceof BusinessException ? error.message : '登录异常';
      await this.loginLogService.asyncCreate({
        userName: username,
        ipaddr: ip,
        browser,
        os,
        status: '1',
        msg,
      });
      throw error;
    }
  }

  /**
   * 从请求中提取客户端IP
   * @description 兼容反向代理场景（x-forwarded-for / x-real-ip）
   */
  private getClientIp(req?: Request): string {
    const headers = req?.headers;
    const xForwardedFor = headers?.['x-forwarded-for'];
    const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const xRealIp = headers?.['x-real-ip'];
    const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    if (realIp) {
      return realIp;
    }
    return req?.ip || '';
  }

  async getUserInfo(userId: number) {
    const userInfo = await this.authCacheService.getUserCache(userId);
    if (userInfo) {
      return userInfo;
    }

    // 缓存缺失（被清除 / 权限变更后失效）：从数据库重建，保证权限即时生效且无需强制重新登录
    const user = await this.userService.findByIdWithRolesMenus(userId);
    if (!user || user.status === '0') {
      throw new BusinessException('用户不存在或已被禁用', ErrorCodeEnum.USER_DISABLED);
    }

    const rebuilt = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      roles: user.roles?.map((role) => ({ id: role.id, name: role.name })) || [],
      permissions: this.extractPermissions(user),
    };
    await this.authCacheService.setUserCache(user.id, rebuilt);
    return rebuilt;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.appConfigService.jwt.refreshSecret,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || user.status === '0') {
        throw new BusinessException('用户不存在或已被禁用', ErrorCodeEnum.USER_DISABLED);
      }

      const tokens = await this.generateTokens(user);

      // 更新Redis缓存（refresh 时 UserVo 不含 menus 关联，permissions 从已有缓存读取避免丢失）
      const cachedUserInfo = await this.authCacheService.getUserCache(user.id);
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        roles: user.roles?.map((role) => ({ id: role.id, name: role.name })) || [],
        permissions: cachedUserInfo?.permissions || [],
      };
      await this.authCacheService.setUserCache(user.id, userInfo);

      // 刷新 token 后写入新的在线记录（不携带 IP/UA，因为 refresh 接口无 req）
      await this.recordOnlineUser(tokens.accessToken, user, {});

      return tokens;
    } catch {
      throw new BusinessException('Token无效或已过期', ErrorCodeEnum.TOKEN_INVALID);
    }
  }

  async logout(userId: number, token?: string) {
    // 将 token 加入黑名单，TTL 设为 token 剩余有效期（避免黑名单无限增长）
    if (token) {
      try {
        const payload = this.jwtService.decode<JwtPayload | null>(token);
        if (payload?.exp) {
          const ttl = payload.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await this.authCacheService.addToTokenBlacklist(token, ttl);
          }
        } else {
          // 无法解析过期时间，使用默认 TTL
          await this.authCacheService.addToTokenBlacklist(token);
        }
        // 移除该 token 的在线用户记录
        await this.authCacheService.removeOnlineUser(token);
      } catch {
        // 解析失败，使用默认 TTL
        await this.authCacheService.addToTokenBlacklist(token);
        await this.authCacheService.removeOnlineUser(token);
      }
    }
    // 清除用户信息缓存
    await this.authCacheService.removeUserCache(userId);
  }

  /**
   * 记录在线用户到 Redis
   * @description 按 token 维度存储在线用户信息，TTL 为 token 剩余有效期
   * @param token access token
   * @param user 用户实体
   * @param extra 附加信息（IP、浏览器、操作系统）
   */
  private async recordOnlineUser(
    token: string,
    user: { id: number; username: string; nickname?: string },
    extra: { ip?: string; browser?: string; os?: string },
  ): Promise<void> {
    try {
      const payload = this.jwtService.decode<JwtPayload | null>(token);
      const exp = payload?.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp ? exp - now : this.appConfigService.redisKeys.online.expiresIn;
      if (ttl <= 0) return; // token 已过期，无需记录

      const onlineInfo = {
        tokenId: token,
        userId: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        ipaddr: extra.ip || '',
        browser: extra.browser || '',
        os: extra.os || '',
        loginTime: new Date().toISOString(),
      };
      await this.authCacheService.setOnlineUser(token, onlineInfo, ttl);
    } catch {
      // 记录失败不影响登录主流程
    }
  }

  async getRouters(userInfo: UserInfoDto) {
    let menus: Menu[];

    if (userInfo.username === SUPER_ADMIN_USERNAME) {
      menus = await this.menuRepository.findAll();
      menus = menus.filter((menu) => menu.menuType === 'M' || menu.menuType === 'C');
    } else {
      const roleIds = userInfo.roles?.map((role) => role.id) || [];
      menus = await this.menuRepository.findByRoleIds(roleIds);
    }

    return buildMenus(menus);
  }

  private extractPermissions(user: User): string[] {
    const permissions = new Set<string>();
    user.roles?.forEach((role) => {
      role.menus?.forEach((menu) => {
        if (menu.perms) {
          permissions.add(menu.perms);
        }
      });
    });
    return Array.from(permissions);
  }

  private async generateTokens(user: Pick<User, 'id' | 'username'>) {
    const payload = { sub: user.id, username: user.username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.appConfigService.jwt.secret,
        expiresIn: this.appConfigService.parseDurationToSeconds(this.appConfigService.jwt.accessTokenExpiresIn),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.appConfigService.jwt.refreshSecret,
        expiresIn: this.appConfigService.parseDurationToSeconds(this.appConfigService.jwt.refreshTokenExpiresIn),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
