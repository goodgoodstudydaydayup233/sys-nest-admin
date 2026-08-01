import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { AppConfigService } from '../config/config.service';
import { UserInfoDto } from '../../common/dto/user-info.dto';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: AppConfigService,
  ) {}

  // ==================== 通用方法 ====================

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, expiresIn?: number): Promise<void> {
    if (expiresIn) {
      await this.redis.set(key, value, 'EX', expiresIn);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * 递增计数器
   * @description 若 key 不存在则先初始化为 0 再递增
   * @param key Redis key
   * @returns 递增后的值
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  // ==================== 用户缓存 ====================

  async setUserCache(userId: number, userInfo: UserInfoDto): Promise<void> {
    const { prefix, expiresIn } = this.configService.redisKeys.user;
    const key = `${prefix}${userId}`;
    await this.set(key, JSON.stringify(userInfo), expiresIn);
  }

  async getUserCache(userId: number): Promise<UserInfoDto | null> {
    const { prefix } = this.configService.redisKeys.user;
    const key = `${prefix}${userId}`;
    const data = await this.get(key);
    return data ? (JSON.parse(data) as UserInfoDto) : null;
  }

  async removeUserCache(userId: number): Promise<void> {
    const { prefix } = this.configService.redisKeys.user;
    const key = `${prefix}${userId}`;
    await this.del(key);
  }

  // ==================== 验证码 ====================

  async setCaptcha(captchaKey: string, code: string): Promise<void> {
    const { prefix, expiresIn } = this.configService.redisKeys.captcha;
    const key = `${prefix}${captchaKey}`;
    await this.set(key, code.toLowerCase(), expiresIn);
  }

  async getCaptcha(captchaKey: string): Promise<string | null> {
    const { prefix } = this.configService.redisKeys.captcha;
    const key = `${prefix}${captchaKey}`;
    return this.get(key);
  }

  async removeCaptcha(captchaKey: string): Promise<void> {
    const { prefix } = this.configService.redisKeys.captcha;
    const key = `${prefix}${captchaKey}`;
    await this.del(key);
  }

  // ==================== Token黑名单 ====================

  async addToTokenBlacklist(token: string, expiresIn?: number): Promise<void> {
    const { prefix } = this.configService.redisKeys.tokenBlacklist;
    const key = `${prefix}${token}`;
    const exp = expiresIn || this.configService.redisKeys.tokenBlacklist.expiresIn;
    await this.set(key, '1', exp);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const { prefix } = this.configService.redisKeys.tokenBlacklist;
    const key = `${prefix}${token}`;
    return this.exists(key);
  }

  // ==================== 字典数据缓存 ====================

  /**
   * 设置字典数据缓存
   * @param dictType 字典类型
   * @param data 字典数据 JSON 字符串
   */
  async setDictCache(dictType: string, data: string): Promise<void> {
    const { prefix, expiresIn } = this.configService.redisKeys.dict;
    const key = `${prefix}${dictType}`;
    await this.set(key, data, expiresIn || undefined);
  }

  /**
   * 获取字典数据缓存
   * @param dictType 字典类型
   */
  async getDictCache(dictType: string): Promise<string | null> {
    const { prefix } = this.configService.redisKeys.dict;
    const key = `${prefix}${dictType}`;
    return this.get(key);
  }

  /**
   * 移除指定字典类型缓存
   * @param dictType 字典类型
   */
  async removeDictCache(dictType: string): Promise<void> {
    const { prefix } = this.configService.redisKeys.dict;
    const key = `${prefix}${dictType}`;
    await this.del(key);
  }

  /**
   * 清空所有字典数据缓存
   * @description 通过扫描 dict 前缀下所有 key 并删除
   */
  async clearDictCache(): Promise<void> {
    const { prefix } = this.configService.redisKeys.dict;
    const keys = await this.redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ==================== 参数配置缓存 ====================

  /**
   * 设置参数配置缓存
   * @param configKey 配置键
   * @param data 配置值
   */
  async setConfigCache(configKey: string, data: string): Promise<void> {
    const { prefix, expiresIn } = this.configService.redisKeys.config;
    const key = `${prefix}${configKey}`;
    await this.set(key, data, expiresIn || undefined);
  }

  /**
   * 获取参数配置缓存
   * @param configKey 配置键
   */
  async getConfigCache(configKey: string): Promise<string | null> {
    const { prefix } = this.configService.redisKeys.config;
    const key = `${prefix}${configKey}`;
    return this.get(key);
  }

  /**
   * 移除指定参数配置缓存
   * @param configKey 配置键
   */
  async removeConfigCache(configKey: string): Promise<void> {
    const { prefix } = this.configService.redisKeys.config;
    const key = `${prefix}${configKey}`;
    await this.del(key);
  }

  /**
   * 清空所有参数配置缓存
   */
  async clearConfigCache(): Promise<void> {
    const { prefix } = this.configService.redisKeys.config;
    const keys = await this.redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ==================== 在线用户缓存 ====================

  /**
   * 记录在线用户（按 token 维度）
   * @description 每个登录 token 对应一条在线记录，TTL 与 token 有效期一致，自动过期
   * @param token access token（作为 key 标识）
   * @param data 在线用户信息 JSON 字符串
   * @param ttl 存活时间（秒），通常为 token 剩余有效期
   */
  async setOnlineUser(token: string, data: string, ttl: number): Promise<void> {
    const { prefix } = this.configService.redisKeys.online;
    const key = `${prefix}${token}`;
    await this.set(key, data, ttl);
  }

  /**
   * 获取指定 token 的在线记录
   */
  async getOnlineUser(token: string): Promise<string | null> {
    const { prefix } = this.configService.redisKeys.online;
    const key = `${prefix}${token}`;
    return this.get(key);
  }

  /**
   * 移除指定 token 的在线记录
   */
  async removeOnlineUser(token: string): Promise<void> {
    const { prefix } = this.configService.redisKeys.online;
    const key = `${prefix}${token}`;
    await this.del(key);
  }

  /**
   * 扫描所有在线用户记录
   * @description 使用 SCAN 避免阻塞 Redis（keys 命令在大 key 量下会阻塞）
   * @returns 所有在线用户记录数组 [{ token, data }]
   */
  async scanOnlineUsers(): Promise<{ token: string; data: string }[]> {
    const { prefix } = this.configService.redisKeys.online;
    const result: { token: string; data: string }[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = next;
      for (const key of batch) {
        const token = key.slice(prefix.length);
        const data = await this.get(key);
        if (data) {
          result.push({ token, data });
        }
      }
    } while (cursor !== '0');
    return result;
  }
}
