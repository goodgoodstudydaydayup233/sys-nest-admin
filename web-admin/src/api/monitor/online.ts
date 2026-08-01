/**
 * 在线用户 API
 * @description 对应 monitor/online 接口
 *
 * @接口说明
 * - GET    /monitor/online/list          查询在线用户列表（支持用户名/IP 筛选）
 * - DELETE /monitor/online/:tokenId      强退指定 token 的用户
 */

import http from '@/utils/request'

// ==================== 类型定义 ====================

/** 在线用户视图对象 */
export interface OnlineUserVo {
  /** access token（强退时作为参数传入） */
  tokenId: string
  /** 用户ID */
  userId: number
  /** 用户名 */
  username: string
  /** 昵称 */
  nickname: string
  /** 登录 IP */
  ipaddr: string
  /** 浏览器 */
  browser: string
  /** 操作系统 */
  os: string
  /** 登录时间（ISO 字符串） */
  loginTime: string
}

/** 在线用户查询参数 */
export interface QueryOnlineParams {
  /** 用户名（模糊匹配） */
  username?: string
  /** 登录 IP（模糊匹配） */
  ipaddr?: string
}

// ==================== online API ====================

export const onlineApi = {
  /** 查询在线用户列表 */
  getOnlineList(params?: QueryOnlineParams): Promise<OnlineUserVo[]> {
    return http.get<OnlineUserVo[]>({ url: '/monitor/online/list', params })
  },

  /** 强退用户 */
  forceLogout(tokenId: string): Promise<void> {
    return http.delete<void>({ url: `/monitor/online/${encodeURIComponent(tokenId)}` })
  },
}
