/**
 * 操作日志 API
 * @description 对标若依操作日志接口，按后端 LogController 拆分
 *
 * @接口清单
 * - GET    /oper-log           获取操作日志列表（分页 + 筛选）
 * - GET    /oper-log/{id}      获取操作日志详情
 * - DELETE /oper-log           批量删除操作日志（body: { ids: number[] }）
 * - DELETE /oper-log/clean     清空所有操作日志
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 操作日志视图对象 */
export interface OperLogVo {
  id: number | string
  /** 模块标题 */
  title: string
  /** 业务类型: 0-其它 1-新增 2-修改 3-删除 4-授权 5-导出 6-导入 7-强退 8-生成代码 9-清空数据 */
  businessType: string
  /** 方法名称 */
  method: string
  /** 请求方式 */
  requestMethod: string
  /** 操作人员 */
  operName: string
  /** 请求URL */
  operUrl: string
  /** 主机地址 */
  operIp?: string
  /** 操作地点 */
  operLocation?: string
  /** 请求参数 */
  operParam?: string
  /** 返回参数 */
  jsonResult?: string
  /** 操作状态: 0-正常 1-异常 */
  status: string
  /** 错误消息 */
  errorMsg?: string
  /** 消耗时间(ms) */
  costTime?: number
  createdAt?: string
  updatedAt?: string
}

/** 操作日志列表响应 */
export type OperLogListVo = PaginationResult<OperLogVo>

/** 操作日志查询参数 */
export interface QueryOperLogParams extends PageParams {
  title?: string
  operName?: string
  businessType?: string
  status?: string
  requestMethod?: string
  startTime?: string
  endTime?: string
}

/** 批量删除参数 */
export interface BatchDeleteParams {
  ids: (number | string)[]
}

// ==================== 业务类型枚举 ====================

/** 业务类型映射 */
export const businessTypeMap: Record<string, string> = {
  '0': '其它',
  '1': '新增',
  '2': '修改',
  '3': '删除',
  '4': '授权',
  '5': '导出',
  '6': '导入',
  '7': '强退',
  '8': '生成代码',
  '9': '清空数据',
}

/** 业务类型 tag 类型映射 */
export const businessTypeTagType: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
  '0': 'info',
  '1': 'success',
  '2': 'warning',
  '3': 'danger',
  '4': '',
  '5': 'success',
  '6': 'warning',
  '7': 'danger',
  '8': '',
  '9': 'danger',
}

// ==================== operLog API ====================

export const operLogApi = {
  /** 获取操作日志列表 */
  getOperLogList(params: QueryOperLogParams): Promise<OperLogListVo> {
    return http.get<OperLogListVo>({ url: '/oper-log', params })
  },

  /** 获取操作日志详情 */
  getOperLogDetail(id: number | string): Promise<OperLogVo> {
    return http.get<OperLogVo>({ url: `/oper-log/${id}` })
  },

  /** 批量删除操作日志 */
  batchRemoveOperLog(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({ url: '/oper-log', data })
  },

  /** 清空所有操作日志 */
  cleanOperLog(): Promise<void> {
    return http.delete<void>({ url: '/oper-log/clean' })
  },
}
