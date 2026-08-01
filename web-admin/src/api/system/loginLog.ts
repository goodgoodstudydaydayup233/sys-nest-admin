/**
 * 登录日志 API
 * @description 按后端 LoginLogController 拆分
 *
 * @接口清单
 * - GET    /logininfor           获取登录日志列表（分页 + 筛选）
 * - GET    /logininfor/{id}      获取登录日志详情
 * - DELETE /logininfor           批量删除登录日志（body: { ids: number[] }）
 * - DELETE /logininfor/clean     清空所有登录日志
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 登录日志视图对象 */
export interface LoginLogVo {
  id: number | string
  /** 用户账号 */
  userName: string
  /** 登录IP地址 */
  ipaddr?: string
  /** 登录地点 */
  loginLocation?: string
  /** 浏览器类型 */
  browser?: string
  /** 操作系统 */
  os?: string
  /** 登录状态: 0-成功 1-失败 */
  status: string
  /** 提示消息 */
  msg?: string
  /** 登录时间 */
  loginTime?: string
}

/** 登录日志列表响应 */
export type LoginLogListVo = PaginationResult<LoginLogVo>

/** 登录日志查询参数 */
export interface QueryLoginLogParams extends PageParams {
  userName?: string
  ipaddr?: string
  status?: string
  startTime?: string
  endTime?: string
}

/** 批量删除参数 */
export interface BatchDeleteParams {
  ids: (number | string)[]
}

// ==================== 登录日志 API ====================

export const loginLogApi = {
  /** 获取登录日志列表 */
  getLoginLogList(params: QueryLoginLogParams): Promise<LoginLogListVo> {
    return http.get<LoginLogListVo>({ url: '/logininfor', params })
  },

  /** 获取登录日志详情 */
  getLoginLogDetail(id: number | string): Promise<LoginLogVo> {
    return http.get<LoginLogVo>({ url: `/logininfor/${id}` })
  },

  /** 批量删除登录日志 */
  batchRemoveLoginLog(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({ url: '/logininfor', data })
  },

  /** 清空所有登录日志 */
  cleanLoginLog(): Promise<void> {
    return http.delete<void>({ url: '/logininfor/clean' })
  },
}
