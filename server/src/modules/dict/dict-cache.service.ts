import { Injectable } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';
import { DictData } from './entities/dict-data.entity';
import { DictDataVo } from './vo/dict-data.vo';

/**
 * 字典数据缓存服务
 * @description 按 `dictType` 维度缓存字典数据，避免每次查询数据库
 *
 * @缓存策略
 * - 读穿透：先读缓存，未命中读数据库并回填
 * - 主动失效：字典数据/类型变更时主动清除对应缓存
 * - 永久缓存：默认 expiresIn=0，由 CRUD 主动失效，避免缓存雪崩
 *
 * @键命名 `${prefix}${dictType}`，prefix 默认 `dict:data:`
 *
 * @example
 * ```ts
 * // 读取字典数据（带缓存）
 * const list = await dictCacheService.getDictDataByType('sys_user_sex');
 * // 字典数据变更后失效对应缓存
 * await dictCacheService.invalidateByType('sys_user_sex');
 * ```
 */
@Injectable()
export class DictCacheService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 从缓存读取字典数据，未命中返回 null
   * @param dictType 字典类型
   */
  async get(dictType: string): Promise<DictDataVo[] | null> {
    const raw = await this.redisService.getDictCache(dictType);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DictDataVo[];
    } catch {
      // 缓存数据损坏，移除并返回 null
      await this.redisService.removeDictCache(dictType);
      return null;
    }
  }

  /**
   * 写入字典数据缓存
   * @param dictType 字典类型
   * @param list 字典数据列表
   */
  async set(dictType: string, list: DictDataVo[] | DictData[]): Promise<void> {
    await this.redisService.setDictCache(dictType, JSON.stringify(list));
  }

  /**
   * 失效指定字典类型的缓存
   * @param dictType 字典类型
   */
  async invalidateByType(dictType: string): Promise<void> {
    if (!dictType) return;
    await this.redisService.removeDictCache(dictType);
  }

  /**
   * 清空所有字典缓存
   * @description 用于刷新缓存接口
   */
  async clearAll(): Promise<void> {
    await this.redisService.clearDictCache();
  }
}
