/**
 * 参数配置 API
 * @description 提供系统参数配置的增删改查及缓存刷新能力
 *
 * @接口清单
 * - GET    /config                  获取参数配置列表（分页 + 筛选）
 * - GET    /config/key/:configKey   根据配置键获取值（缓存优先）
 * - DELETE /config/refreshCache     刷新参数配置缓存
 * - GET    /config/:id              获取参数配置详情
 * - POST   /config                  创建参数配置
 * - PUT    /config/:id              更新参数配置
 * - DELETE /config/:id              删除参数配置
 *
 * @example 使用示例
 * ```typescript
 * import { configApi } from '@/api/system'
 *
 * // 获取列表
 * const { list, total } = await configApi.getConfigList({ page: 1, pageSize: 10 })
 *
 * // 根据 key 取值（缓存优先）
 * const value = await configApi.getConfigValueByKey('sys.title')
 *
 * // 刷新缓存
 * await configApi.refreshCache()
 * ```
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 参数配置视图对象 */
export interface ConfigVo {
  /** 主键 ID */
  id: number | string
  /** 配置键 */
  configKey: string
  /** 配置值 */
  configValue: string
  /** 配置名称 */
  name: string
  /** 配置分组 */
  group: string
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 参数配置列表响应（后端 ConfigListVo） */
export type ConfigListVo = PaginationResult<ConfigVo> & {
  page: number
  pageSize: number
}

/** 参数配置查询参数 */
export interface QueryConfigParams extends PageParams {
  /** 配置名称 */
  name?: string
  /** 配置分组 */
  group?: string
}

/** 创建参数配置参数 */
export interface CreateConfigParams {
  /** 配置键 */
  configKey: string
  /** 配置值 */
  configValue: string
  /** 配置名称 */
  name: string
  /** 配置分组 */
  group?: string
  /** 备注 */
  remark?: string
}

/** 更新参数配置参数（全部可选） */
export type UpdateConfigParams = Partial<CreateConfigParams>

// ==================== config API ====================

export const configApi = {
  /** 获取参数配置列表（分页 + 筛选） */
  getConfigList(params: QueryConfigParams): Promise<ConfigListVo> {
    return http.get<ConfigListVo>({ url: '/config', params })
  },

  /** 根据配置键获取值（缓存优先） */
  getConfigValueByKey(configKey: string): Promise<string | null> {
    return http.get<string | null>({ url: `/config/key/${encodeURIComponent(configKey)}` })
  },

  /** 刷新参数配置缓存（清空并重新预热） */
  refreshCache(): Promise<{ count: number }> {
    return http.delete<{ count: number }>({ url: '/config/refreshCache' })
  },

  /** 获取参数配置详情 */
  getConfigDetail(id: number | string): Promise<ConfigVo> {
    return http.get<ConfigVo>({ url: `/config/${id}` })
  },

  /** 创建参数配置 */
  createConfig(data: CreateConfigParams): Promise<void> {
    return http.post<void>({ url: '/config', data })
  },

  /** 更新参数配置 */
  updateConfig(id: number | string, data: UpdateConfigParams): Promise<void> {
    return http.put<void>({ url: `/config/${id}`, data })
  },

  /** 删除参数配置 */
  deleteConfig(id: number | string): Promise<void> {
    return http.delete<void>({ url: `/config/${id}` })
  },
}
