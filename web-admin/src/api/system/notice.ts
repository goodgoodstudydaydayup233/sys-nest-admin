/**
 * 通知公告 API
 * @description 提供通知公告的增删改查能力
 *
 * @接口清单
 * - GET    /system/notice           获取通知公告列表（分页 + 筛选）
 * - GET    /system/notice/:id       获取通知公告详情
 * - POST   /system/notice           创建通知公告
 * - PUT    /system/notice/:id       更新通知公告
 * - DELETE /system/notice/:id       删除通知公告
 *
 * @example 使用示例
 * ```typescript
 * import { noticeApi } from '@/api/system'
 *
 * // 获取列表
 * const { list, total } = await noticeApi.getNoticeList({ page: 1, pageSize: 10 })
 *
 * // 创建通知
 * await noticeApi.createNotice({
 *   noticeTitle: '系统维护通知',
 *   noticeType: '1',
 *   noticeContent: '<p>将于今晚 22:00 维护</p>',
 *   status: '0',
 * })
 * ```
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 通知公告视图对象 */
export interface NoticeVo {
  /** 主键 ID */
  id: number | string
  /** 通知标题 */
  noticeTitle: string
  /** 通知类型: 1-通知 2-公告 */
  noticeType: string
  /** 通知内容（富文本） */
  noticeContent?: string
  /** 状态: 0-正常 1-关闭 */
  status: string
  /** 创建者 */
  createBy?: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 通知公告列表响应 */
export type NoticeListVo = PaginationResult<NoticeVo> & {
  page: number
  pageSize: number
}

/** 查询参数 */
export interface QueryNoticeParams extends PageParams {
  /** 通知标题（模糊匹配） */
  noticeTitle?: string
  /** 创建者（模糊匹配） */
  createBy?: string
  /** 通知类型: 1-通知 2-公告 */
  noticeType?: string
}

/** 创建参数 */
export interface CreateNoticeParams {
  noticeTitle: string
  noticeType: string
  noticeContent?: string
  status?: string
}

/** 更新参数（全部可选） */
export type UpdateNoticeParams = Partial<CreateNoticeParams>

// ==================== notice API ====================

export const noticeApi = {
  /** 获取通知公告列表 */
  getNoticeList(params: QueryNoticeParams): Promise<NoticeListVo> {
    return http.get<NoticeListVo>({ url: '/system/notice', params })
  },

  /** 获取通知公告详情 */
  getNoticeDetail(id: number | string): Promise<NoticeVo> {
    return http.get<NoticeVo>({ url: `/system/notice/${id}` })
  },

  /** 创建通知公告 */
  createNotice(data: CreateNoticeParams): Promise<NoticeVo> {
    return http.post<NoticeVo>({ url: '/system/notice', data })
  },

  /** 更新通知公告 */
  updateNotice(id: number | string, data: UpdateNoticeParams): Promise<NoticeVo> {
    return http.put<NoticeVo>({ url: `/system/notice/${id}`, data })
  },

  /** 删除通知公告 */
  deleteNotice(id: number | string): Promise<void> {
    return http.delete<void>({ url: `/system/notice/${id}` })
  },
}
