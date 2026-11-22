import { Injectable } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';
import { UserInfoDto } from '../../common/dto/user-info.dto';
import { OnlineUserVo } from '../online/vo/online-user.vo';

/** 登录重试计数器 Redis key 前缀 */
const LOGIN_RETRY_PREFIX = 'login:retry:';
/** 登录锁定标记 Redis key 前缀 */
const LOGIN_LOCK_PREFIX = 'login:lock:';

@Injectable()
export class AuthCacheService {
  constructor(private readonly redisService: RedisService) {}

  async setUserCache(userId: number, userInfo: UserInfoDto): Promise<void> {
    return this.redisService.setUserCache(userId, userInfo);
  }

  async getUserCache(userId: number): Promise<UserInfoDto | null> {
    return this.redisService.getUserCache(userId);
  }

  async removeUserCache(userId: number): Promise<void> {
    return this.redisService.removeUserCache(userId);
  }

  /**
   * 清空所有用户信息缓存
   * @description 角色/菜单权限变更后调用，使全部在线用户的权限即时刷新（不依赖 24h 过期）
   */
  async clearAllUserCache(): Promise<void> {
    return this.redisService.clearAllUserCache();
  }

  /**
   * 将 token 加入黑名单
   * @param token JWT token
   * @param ttl 黑名单存活时间（秒），通常设为 token 剩余有效期
   */
  async addToTokenBlacklist(token: string, ttl?: number): Promise<void> {
    return this.redisService.addToTokenBlacklist(token, ttl);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.redisService.isTokenBlacklisted(token);
  }

  // ==================== 登录重试 / 锁定 ====================

  /**
   * 递增登录失败次数并返回当前值
   * @description 首次失败时自动设置 TTL（与锁定时间一致），超时后计数器自动归零
   * @param username 用户名
   * @param lockTimeSeconds 锁定时间（秒），作为计数器 TTL
   * @returns 当前失败次数
   */
  async incrLoginRetryCount(username: string, lockTimeSeconds: number): Promise<number> {
    const key = `${LOGIN_RETRY_PREFIX}${username}`;
    const count = await this.redisService.incr(key);
    if (count === 1) {
      await this.redisService.expire(key, lockTimeSeconds);
    }
    return count;
  }

  /**
   * 获取登录失败次数
   * @param username 用户名
   * @returns 失败次数（不存在则为 0）
   */
  async getLoginRetryCount(username: string): Promise<number> {
    const key = `${LOGIN_RETRY_PREFIX}${username}`;
    const val = await this.redisService.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * 清除登录失败次数
   * @param username 用户名
   */
  async clearLoginRetryCount(username: string): Promise<void> {
    const key = `${LOGIN_RETRY_PREFIX}${username}`;
    await this.redisService.del(key);
  }

  /**
   * 锁定用户
   * @param username 用户名
   * @param lockTimeSeconds 锁定时长（秒）
   */
  async lockUser(username: string, lockTimeSeconds: number): Promise<void> {
    const key = `${LOGIN_LOCK_PREFIX}${username}`;
    await this.redisService.set(key, '1', lockTimeSeconds);
  }

  /**
   * 检查用户是否被锁定
   * @param username 用户名
   * @returns true-已锁定 false-未锁定
   */
  async isUserLocked(username: string): Promise<boolean> {
    const key = `${LOGIN_LOCK_PREFIX}${username}`;
    return this.redisService.exists(key);
  }

  /**
   * 获取锁定剩余时间
   * @param username 用户名
   * @returns 剩余秒数（-1-永久 -2-不存在）
   */
  async getLockTTL(username: string): Promise<number> {
    const key = `${LOGIN_LOCK_PREFIX}${username}`;
    return this.redisService.ttl(key);
  }

  // ==================== 在线用户 ====================

  /**
   * 记录在线用户（按 token 维度）
   * @param token access token
   * @param info 在线用户信息对象
   * @param ttl 存活时间（秒），通常为 token 剩余有效期
   */
  async setOnlineUser(token: string, info: OnlineUserVo, ttl: number): Promise<void> {
    return this.redisService.setOnlineUser(token, JSON.stringify(info), ttl);
  }

  /**
   * 获取指定 token 的在线用户记录
   * @param token access token
   * @returns 在线用户信息对象，不存在则 null
   */
  async getOnlineUser(token: string): Promise<OnlineUserVo | null> {
    const data = await this.redisService.getOnlineUser(token);
    return data ? (JSON.parse(data) as OnlineUserVo) : null;
  }

  /**
   * 移除指定 token 的在线记录
   * @param token access token
   */
  async removeOnlineUser(token: string): Promise<void> {
    return this.redisService.removeOnlineUser(token);
  }

  /**
   * 扫描所有在线用户记录
   * @returns 在线用户信息数组（含 token 字段）
   */
  async scanOnlineUsers(): Promise<OnlineUserVo[]> {
    const list = await this.redisService.scanOnlineUsers();
    return list.map((item) => ({ ...(JSON.parse(item.data) as OnlineUserVo), token: item.token }));
  }

  /**
   * 强制下线用户（强退）
   * @description 账号被禁用/删除时调用：将该用户所有在线 token 加入黑名单、
   * 移除在线记录并清除用户缓存，使其正在使用的会话立即失效。
   * 对方下一次请求将因 token 黑名单返回 401 → 前端刷新 token 失败 → 自动跳转登录页。
   * @param userId 目标用户ID
   * @returns 被强制下线的会话数量
   */
  async forceLogoutUser(userId: number): Promise<number> {
    const onlineUsers = await this.scanOnlineUsers();
    let count = 0;
    for (const item of onlineUsers) {
      if (item.userId === userId) {
        // 加入 token 黑名单：默认 TTL 覆盖 token 剩余有效期，token 过期后黑名单 key 自动清除
        await this.addToTokenBlacklist(item.tokenId);
        await this.removeOnlineUser(item.tokenId);
        count++;
      }
    }
    // 清除用户权限缓存，避免缓存命中后仍可访问接口
    await this.removeUserCache(userId);
    return count;
  }
}
