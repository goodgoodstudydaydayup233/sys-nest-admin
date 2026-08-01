/**
 * 缓存监控 API
 * @description 对标若依缓存监控与缓存列表接口
 *
 * @接口分组
 * 1. 缓存监控（cache/index.vue）
 *    - GET /cache            获取 Redis 监控信息
 *
 * 2. 缓存列表（cacheList/index.vue，按业务前缀分组三栏）
 *    - GET    /cache/names                       获取缓存名称列表
 *    - GET    /cache/keys/:cacheName             获取指定缓存名称下的 key 列表
 *    - GET    /cache/value?cacheName&cacheKey    获取缓存内容
 *    - DELETE /cache/clearCacheName/:cacheName   清理指定缓存名称下所有 key
 *    - DELETE /cache/clearCacheKey?cacheName&cacheKey  清理指定 key
 *    - DELETE /cache/clearCacheAll               清理所有业务缓存
 */

import http from '@/utils/request'

// ==================== 类型定义 ====================

/** Redis INFO 分组信息 */
export type RedisInfo = Record<string, Record<string, string>>

/** 命令统计项 */
export interface CommandStat {
  name: string
  value: string
}

/** Redis 监控信息视图对象 */
export interface CacheMonitorVo {
  /** Redis INFO 分组信息 */
  info: RedisInfo
  /** 当前 db 的 key 数量 */
  dbSize: number
  /** 命令执行统计（用于图表展示） */
  commandStats: CommandStat[]
}

/** 缓存名称视图对象（左栏） */
export interface CacheNameVo {
  /** 缓存名称（业务标识，如 sys_config） */
  cacheName: string
  /** 备注说明 */
  remark: string
}

/** 缓存内容详情（右栏） */
export interface CacheContentVo {
  /** 缓存名称 */
  cacheName: string
  /** 缓存键名（完整） */
  cacheKey: string
  /** 数据类型 */
  type: string
  /** 缓存内容（复杂类型已 JSON 序列化） */
  cacheValue: string
  /** TTL 秒数 */
  ttl: number
}

// ==================== cache API ====================

export const cacheApi = {
  // ===== 缓存监控 =====

  /** 获取 Redis 监控信息 */
  getCacheMonitor(): Promise<CacheMonitorVo> {
    return http.get<CacheMonitorVo>({ url: '/cache' })
  },

  // ===== 缓存列表 =====

  /** 获取缓存名称列表（左栏） */
  getCacheNames(): Promise<CacheNameVo[]> {
    return http.get<CacheNameVo[]>({ url: '/cache/names' })
  },

  /** 获取指定缓存名称下的 key 列表（中栏） */
  getCacheKeys(cacheName: string): Promise<string[]> {
    return http.get<string[]>({ url: `/cache/keys/${encodeURIComponent(cacheName)}` })
  },

  /** 获取缓存内容（右栏） */
  getCacheValue(cacheName: string, cacheKey: string): Promise<CacheContentVo> {
    return http.get<CacheContentVo>({
      url: '/cache/value',
      params: { cacheName, cacheKey },
    })
  },

  /** 清理指定缓存名称下所有 key */
  clearCacheName(cacheName: string): Promise<void> {
    return http.delete<void>({ url: `/cache/clearCacheName/${encodeURIComponent(cacheName)}` })
  },

  /** 清理指定缓存 key */
  clearCacheKey(cacheName: string, cacheKey: string): Promise<void> {
    return http.delete<void>({
      url: '/cache/clearCacheKey',
      params: { cacheName, cacheKey },
    })
  },

  /** 清理所有业务缓存 */
  clearCacheAll(): Promise<void> {
    return http.delete<void>({ url: '/cache/clearCacheAll' })
  },
}
