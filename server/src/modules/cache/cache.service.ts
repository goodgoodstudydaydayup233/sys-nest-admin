import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { AppConfigService } from '../../core/config/config.service';
import { getCacheNameDefinitions, CacheNameDefinition } from './cache.constants';

/**
 * 缓存监控服务
 * @description 对标若依 RedisController，提供两块能力：
 *
 * 1. 缓存监控（cache/index.vue）：Redis 服务器信息 + 命令统计 + 内存
 *    - getMonitorInfo: 获取 Redis 信息（info 解析 + dbSize + 命令统计）
 *
 * 2. 缓存列表（cacheList/index.vue）：按业务前缀分组的缓存管理（三栏）
 *    - getCacheNames: 列出预定义的缓存名称分组
 *    - getCacheKeysByCacheName: 列出指定分组下的 key
 *    - getCacheContent: 获取指定 key 的内容
 *    - clearCacheName: 清理指定分组所有 key
 *    - clearCacheKey: 清理指定 key
 *    - clearCacheAll: 清理所有业务缓存
 *
 * @说明
 * 业务缓存都在业务 db 上（AppConfigService.redis.db），无需切换 db。
 * getMonitorInfo 直接读取当前连接的 Redis 实例信息。
 */
@Injectable()
export class CacheService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: AppConfigService,
  ) {}

  // ==================== 缓存监控 ====================

  /**
   * 获取 Redis 监控信息
   * @returns { info, dbSize, commandStats }
   * - info: 解析后的 INFO 命令结果（分组结构）
   * - dbSize: 当前 db 的 key 数量
   * - commandStats: 命令执行统计（用于玫瑰图展示）
   */
  async getMonitorInfo(): Promise<{
    info: Record<string, Record<string, string>>;
    dbSize: number;
    commandStats: { name: string; value: string }[];
  }> {
    const rawInfo = await this.redis.info();
    const info = this.parseRedisInfo(rawInfo);
    const dbSize = await this.redis.dbsize();
    const rawCommandStats = await this.redis.info('commandstats');
    const commandStats = this.parseCommandStats(rawCommandStats);
    return { info, dbSize, commandStats };
  }

  // ==================== 缓存列表（按业务前缀分组，对标若依三栏） ====================

  /**
   * 获取预定义的缓存名称列表
   * @description 返回所有业务缓存分组（左栏数据源）
   */
  getCacheNames(): { cacheName: string; remark: string }[] {
    const definitions = getCacheNameDefinitions(this.configService);
    return definitions.map((d) => ({ cacheName: d.cacheName, remark: d.remark }));
  }

  /**
   * 获取指定缓存名称下的 key 列表
   * @param cacheName 缓存名称（业务标识）
   * @returns key 列表（中栏数据源）
   */
  async getCacheKeysByCacheName(cacheName: string): Promise<string[]> {
    const def = this.findDefinition(cacheName);
    if (!def) return [];
    // 扫描前缀下所有 key
    return this.scanKeysOnBusinessDb(`${def.prefix}*`);
  }

  /**
   * 获取指定缓存 key 的内容
   * @param cacheName 缓存名称（用于校验前缀，避免越权访问）
   * @param cacheKey 缓存键名（完整 key）
   * @returns { cacheName, cacheKey, type, cacheValue, ttl }
   */
  async getCacheContent(
    cacheName: string,
    cacheKey: string,
  ): Promise<{
    cacheName: string;
    cacheKey: string;
    type: string;
    cacheValue: string;
    ttl: number;
  }> {
    const def = this.findDefinition(cacheName);
    // 校验 key 必须属于该缓存名称的前缀，避免越权
    if (!def || !cacheKey.startsWith(def.prefix)) {
      return {
        cacheName,
        cacheKey,
        type: 'unknown',
        cacheValue: '(无效的缓存键名)',
        ttl: -2,
      };
    }

    const type = await this.redis.type(cacheKey);
    const ttl = await this.redis.ttl(cacheKey);
    const cacheValue = await this.readByType(cacheKey, type);

    return { cacheName, cacheKey, type, cacheValue, ttl };
  }

  /**
   * 清理指定缓存名称下的所有 key
   * @param cacheName 缓存名称
   */
  async clearCacheName(cacheName: string): Promise<void> {
    const def = this.findDefinition(cacheName);
    if (!def) return;
    const keys = await this.scanKeysOnBusinessDb(`${def.prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * 清理指定缓存 key
   * @param cacheName 缓存名称（用于校验前缀）
   * @param cacheKey 缓存键名
   */
  async clearCacheKey(cacheName: string, cacheKey: string): Promise<void> {
    const def = this.findDefinition(cacheName);
    if (!def || !cacheKey.startsWith(def.prefix)) return;
    await this.redis.del(cacheKey);
  }

  /**
   * 清理所有业务缓存
   * @description 遍历所有预定义缓存名称，逐组清理
   */
  async clearCacheAll(): Promise<void> {
    const definitions = getCacheNameDefinitions(this.configService);
    for (const def of definitions) {
      const keys = await this.scanKeysOnBusinessDb(`${def.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 查找缓存名称定义
   */
  private findDefinition(cacheName: string): CacheNameDefinition | undefined {
    return getCacheNameDefinitions(this.configService).find((d) => d.cacheName === cacheName);
  }

  /**
   * 在业务 db 上扫描 key（业务缓存都在业务 db，无需切换）
   */
  private async scanKeysOnBusinessDb(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }

  /**
   * 按数据类型读取 value
   */
  private async readByType(key: string, type: string): Promise<string> {
    switch (type) {
      case 'string':
        return (await this.redis.get(key)) || '';
      case 'list':
        return JSON.stringify(await this.redis.lrange(key, 0, -1));
      case 'hash':
        return JSON.stringify(await this.redis.hgetall(key));
      case 'set':
        return JSON.stringify(await this.redis.smembers(key));
      case 'zset':
        return JSON.stringify(await this.redis.zrange(key, 0, -1, 'WITHSCORES'));
      default:
        return '(unsupported type)';
    }
  }

  // ==================== 通用解析方法 ====================

  /**
   * 解析 INFO 命令返回的文本为分组结构
   * @example
   * // 输入: "# Server\r\nredis_version:7.0.0\r\n..."
   * // 输出: { Server: { redis_version: '7.0.0', ... }, ... }
   */
  private parseRedisInfo(raw: string): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};
    let currentGroup = '';

    raw.split('\r\n').forEach((line) => {
      if (!line) return;

      // 分组标题：以 # 开头
      if (line.startsWith('# ')) {
        currentGroup = line.slice(2).trim();
        result[currentGroup] = {};
        return;
      }

      // key: value
      if (currentGroup) {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          result[currentGroup][k] = v;
        }
      }
    });

    return result;
  }

  /**
   * 解析 commandstats 为饼图数据
   * @example
   * // 输入: "cmdstat_get:calls=10,usec=100,..."
   * // 输出: [{ name: 'get', value: '10' }, ...]
   */
  private parseCommandStats(raw: string): { name: string; value: string }[] {
    const stats: { name: string; value: string }[] = [];
    raw.split('\r\n').forEach((line) => {
      if (!line || !line.startsWith('cmdstat_')) return;
      const name = line.slice('cmdstat_'.length, line.indexOf(':'));
      const match = line.match(/calls=(\d+)/);
      if (match) {
        stats.push({ name, value: match[1] });
      }
    });
    return stats;
  }
}
