/**
 * 站内信 API
 * @description 站内信发送与个人收件箱管理接口，按后端 Controller 拆分
 *
 * @接口清单
 * - POST   /system/message              发送站内信（定向 / 全员）
 * - GET    /system/message/inbox        本人收件箱（分页 + 筛选）
 * - GET    /system/message/unread-count 本人未读数量
 * - GET    /system/message/{id}         本人消息详情
 * - PUT    /system/message/read-all     全部标记已读
 * - PUT    /system/message/{id}/read    单条标记已读
 * - DELETE /system/message/{id}         删除本人消息
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 消息类型: 1-系统通知 2-业务提醒 3-任务结果 */
export type MessageType = '1' | '2' | '3'

/** 消息状态: 0-未读 1-已读 */
export type MessageStatus = '0' | '1'

/**
 * 站内信视图对象
 * @description 对应后端 MessageVo（继承 BaseVo：id、createdAt、updatedAt）
 */
export interface MessageVo {
  /** 消息 ID */
  id: number
  /** 发送者用户名（system 表示系统发送） */
  senderName: string
  /** 接收用户 ID */
  receiverId: number
  /** 接收用户名 */
  receiverName: string
  /** 消息标题 */
  title: string
  /** 消息内容 */
  content?: string
  /** 消息类型 */
  type: MessageType
  /** 状态: 0-未读 1-已读 */
  status: MessageStatus
  /** 读取时间 */
  readAt?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 发送站内信参数
 * @description 对应后端 SendMessageDto
 */
export interface SendMessageParams {
  /** 消息标题（必填，最多 100 字） */
  title: string
  /** 消息类型: 1-系统通知 2-业务提醒 3-任务结果 */
  type: MessageType
  /** 消息内容（最多 2000 字） */
  content?: string
  /** 接收用户 ID 列表（为空或未传时发送给全部启用用户） */
  receiverIds?: number[]
}

/**
 * 收件箱分页查询参数
 * @description 对应后端 QueryMessageDto，支持按类型/状态/关键字/时间范围筛选
 */
export interface QueryMessageParams extends PageParams {
  /** 消息类型: 1-系统通知 2-业务提醒 3-任务结果 */
  type?: MessageType
  /** 已读状态: 0-未读 1-已读 */
  status?: MessageStatus
  /** 标题/内容关键字 */
  keyword?: string
  /** 开始时间 */
  beginTime?: string
  /** 结束时间 */
  endTime?: string
}

/** 未读数量 */
export interface UnreadCountResult {
  /** 未读数量 */
  count: number
}

// ==================== API 接口定义 ====================

export const messageApi = {
  /**
   * 发送站内信
   * @description POST /system/message；receiverIds 为空时发送给全部启用用户
   * @param data 发送参数
   * @returns 发送条数
   *
   * @example
   * ```typescript
   * await messageApi.sendMessage({
   *   title: '定时任务执行失败',
   *   type: '3',
   *   content: '任务 xxx 执行失败，请检查。',
   *   receiverIds: [1, 2], // 省略则为全员发送
   * })
   * ```
   */
  sendMessage(data: SendMessageParams): Promise<number> {
    return http.post<number>({
      url: '/system/message',
      data,
    })
  },

  /**
   * 获取本人收件箱（分页）
   * @description GET /system/message/inbox
   * @param params 分页 + 筛选条件
   * @returns 分页数据（已解包 data）
   *
   * @example
   * ```typescript
   * const { list, total } = await messageApi.getInbox({ page: 1, pageSize: 10 })
   * ```
   */
  getInbox(params: QueryMessageParams): Promise<PaginationResult<MessageVo>> {
    return http.get<PaginationResult<MessageVo>>({
      url: '/system/message/inbox',
      params,
    })
  },

  /**
   * 获取本人未读数量
   * @description GET /system/message/unread-count
   * @returns 未读数量（已解包 data.count）
   */
  getUnreadCount(): Promise<UnreadCountResult> {
    return http.get<UnreadCountResult>({
      url: '/system/message/unread-count',
    })
  },

  /**
   * 获取本人消息详情
   * @description GET /system/message/{id}
   * @param id 消息 ID
   * @returns 消息详情
   */
  getMessageDetail(id: number | string): Promise<MessageVo> {
    return http.get<MessageVo>({
      url: `/system/message/${id}`,
    })
  },

  /**
   * 单条标记已读
   * @description PUT /system/message/{id}/read
   * @param id 消息 ID
   */
  markRead(id: number | string): Promise<void> {
    return http.put<void>({
      url: `/system/message/${id}/read`,
    })
  },

  /**
   * 全部标记已读
   * @description PUT /system/message/read-all
   */
  markAllRead(): Promise<void> {
    return http.put<void>({
      url: '/system/message/read-all',
    })
  },

  /**
   * 删除本人消息
   * @description DELETE /system/message/{id}
   * @param id 消息 ID
   */
  deleteMessage(id: number | string): Promise<void> {
    return http.delete<void>({
      url: `/system/message/${id}`,
    })
  },
}
