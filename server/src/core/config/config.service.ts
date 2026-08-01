import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get app() {
    return {
      admin: this.configService.get<string>('app.admin', 'admin'),
      // 全局接口前缀，开发环境 dev-api，生产环境 prod-api
      apiPrefix: this.configService.get<string>('app.apiPrefix', 'dev-api'),
    };
  }
  get server() {
    return {
      port: this.configService.get<number>('server.port', 3000),
    };
  }

  get upload() {
    return {
      dest: this.configService.get<string>('upload.dest', './uploads'),
      maxSize: this.configService.get<number>('upload.maxSize', 10),
    };
  }

  get database() {
    return {
      type: this.configService.get<string>('database.type', 'mysql') as 'mysql',
      host: this.configService.get<string>('database.host', 'localhost'),
      port: this.configService.get<number>('database.port', 3306),
      username: this.configService.get<string>('database.username', 'root'),
      password: this.configService.get<string>('database.password', ''),
      database: this.configService.get<string>('database.database', 'h-vue'),
      synchronize: this.configService.get<boolean>('database.synchronize', false),
      logging: this.configService.get<boolean>('database.logging', false),
    };
  }

  get redis() {
    return {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password', ''),
      db: this.configService.get<number>('redis.db', 0),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get<string>('jwt.secret', 'default-secret'),
      refreshSecret: this.configService.get<string>('jwt.refreshSecret', 'default-refresh-secret'),
      accessTokenExpiresIn: this.configService.get<string>('jwt.accessTokenExpiresIn', '2h'),
      refreshTokenExpiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn', '7d'),
    };
  }

  get captcha() {
    return {
      expiresIn: this.configService.get<number>('captcha.expiresIn', 300),
    };
  }

  get swagger() {
    return {
      // Swagger Servers 展示的基础地址，需包含当前环境接口前缀
      serverUrl: this.configService.get<string>('swagger.serverUrl', `http://localhost:${this.server.port}/${this.app.apiPrefix}`),
    };
  }

  get whitelist() {
    return {
      paths: this.configService.get<string[]>('whitelist.paths', []),
      prefixes: this.configService.get<string[]>('whitelist.prefixes', []),
    };
  }

  get redisKeys() {
    return {
      user: {
        prefix: this.configService.get<string>('redisKeys.user.prefix', 'user:info:'),
        expiresIn: this.configService.get<number>('redisKeys.user.expiresIn', 86400),
      },
      captcha: {
        prefix: this.configService.get<string>('redisKeys.captcha.prefix', 'captcha:'),
        expiresIn: this.configService.get<number>('redisKeys.captcha.expiresIn', 300),
      },
      tokenBlacklist: {
        prefix: this.configService.get<string>('redisKeys.tokenBlacklist.prefix', 'token:blacklist:'),
        expiresIn: this.configService.get<number>('redisKeys.tokenBlacklist.expiresIn', 604800),
      },
      dict: {
        prefix: this.configService.get<string>('redisKeys.dict.prefix', 'dict:data:'),
        expiresIn: this.configService.get<number>('redisKeys.dict.expiresIn', 0),
      },
      config: {
        prefix: this.configService.get<string>('redisKeys.config.prefix', 'config:'),
        expiresIn: this.configService.get<number>('redisKeys.config.expiresIn', 0),
      },
      online: {
        prefix: this.configService.get<string>('redisKeys.online.prefix', 'online:token:'),
        // TTL 与 access token 有效期保持一致，token 过期后在线记录自动清除
        expiresIn: this.parseDurationToSeconds(this.configService.get<string>('jwt.accessTokenExpiresIn', '2h')),
      },
    };
  }

  /**
   * 将时长字符串（如 "2h"、"7d"、"30m"、"3600s"）转换为秒数
   * @description 用于将 jwt 配置的过期时间字符串转换为 Redis TTL 或 jwt expiresIn
   * @example
   * parseDurationToSeconds('2h')  // 7200
   * parseDurationToSeconds('7d')  // 604800
   * parseDurationToSeconds('30m') // 1800
   */
  parseDurationToSeconds(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7200; // 默认 2 小时
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] || 3600);
  }
}
