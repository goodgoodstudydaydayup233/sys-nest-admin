/**
 * 错误码定义（与后端 ErrorCodeEnum 完全对齐）
 * @description
 * 前后端统一的错误码规范，确保错误处理一致性
 *
 * 错误码设计原则：
 * - 0: 操作成功（与后端一致）
 * - 4xx: HTTP 客户端错误 + 业务客户端错误
 * - 5xx: HTTP 服务器错误 + 业务服务器/参数错误
 * - 1xxx: 用户相关错误
 * - 2xxx: 验证码相关错误
 * - 3xxx: Token 相关错误
 * - 4xxx: 权限相关错误
 * - 5xxx: 参数相关错误
 *
 * @example
 * ```typescript
 * import { ErrorCodeEnum, getErrorMessage } from '@/utils/request/errorCode'
 *
 * // 判断是否成功
 * if (response.code === ErrorCodeEnum.SUCCESS) {
 *   // 处理成功逻辑
 * }
 *
 * // 获取错误提示
 * const message = getErrorMessage(ErrorCodeEnum.TOKEN_EXPIRED)
 * // → 'Token已过期'
 * ```
 */

// ==================== 错误码枚举（与后端完全一致）====================

/** 业务错误码枚举 */
export enum ErrorCodeEnum {
  // ==================== 成功 ====================
  /** 操作成功（后端约定 code=200 为成功）*/
  SUCCESS = 200,

  // ==================== HTTP 状态码（4xx）====================
  /** 请求参数错误 */
  BAD_REQUEST = 400,
  /** 未授权（未登录或 Token 无效）*/
  UNAUTHORIZED = 401,
  /** 禁止访问（无权限）*/
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,

  // ==================== HTTP 状态码（5xx）====================
  /** 服务器内部错误 */
  INTERNAL_ERROR = 500,

  // ==================== 用户相关错误 (1xxx) ====================
  /** 用户不存在 */
  USER_NOT_FOUND = 1001,
  /** 密码错误 */
  USER_PASSWORD_ERROR = 1002,
  /** 用户已被禁用 */
  USER_DISABLED = 1003,
  /** 用户已存在 */
  USER_ALREADY_EXISTS = 1004,

  // ==================== 验证码相关错误 (2xxx) ====================
  /** 验证码已过期 */
  CAPTCHA_EXPIRED = 2001,
  /** 验证码错误 */
  CAPTCHA_ERROR = 2002,

  // ==================== Token 相关错误 (3xxx) ====================
  /** Token 已过期 */
  TOKEN_EXPIRED = 3001,
  /** Token 无效 */
  TOKEN_INVALID = 3002,

  // ==================== 权限相关错误 (4xxx) ====================
  /** 没有权限 */
  NO_PERMISSION = 4001,
  /** 角色不存在 */
  ROLE_NOT_FOUND = 4002,

  // ==================== 参数相关错误 (5xxx) ====================
  /** 参数错误 */
  PARAM_ERROR = 5001,
}

// ==================== 错误消息映射（与后端完全一致）====================

/**
 * 错误码对应的用户友好提示信息
 * @description 将技术性错误码转换为用户可理解的中文提示
 * 与后端 ErrorMessageMap 保持同步
 */
export const ErrorMessageMap: Record<number, string> = {
  // ==================== 成功 ====================
  [ErrorCodeEnum.SUCCESS]: '操作成功',

  // ==================== HTTP 状态码 ====================
  [ErrorCodeEnum.BAD_REQUEST]: '请求参数错误',
  [ErrorCodeEnum.UNAUTHORIZED]: '未授权',
  [ErrorCodeEnum.FORBIDDEN]: '禁止访问',
  [ErrorCodeEnum.NOT_FOUND]: '资源不存在',
  [ErrorCodeEnum.INTERNAL_ERROR]: '服务器内部错误',

  // ==================== 用户相关错误 ====================
  [ErrorCodeEnum.USER_NOT_FOUND]: '用户不存在',
  [ErrorCodeEnum.USER_PASSWORD_ERROR]: '密码错误',
  [ErrorCodeEnum.USER_DISABLED]: '用户已被禁用',
  [ErrorCodeEnum.USER_ALREADY_EXISTS]: '用户已存在',

  // ==================== 验证码相关错误 ====================
  [ErrorCodeEnum.CAPTCHA_EXPIRED]: '验证码已过期',
  [ErrorCodeEnum.CAPTCHA_ERROR]: '验证码错误',

  // ==================== Token 相关错误 ====================
  [ErrorCodeEnum.TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCodeEnum.TOKEN_INVALID]: 'Token无效',

  // ==================== 权限相关错误 ====================
  [ErrorCodeEnum.NO_PERMISSION]: '没有权限',
  [ErrorCodeEnum.ROLE_NOT_FOUND]: '角色不存在',

  // ==================== 参数相关错误 ====================
  [ErrorCodeEnum.PARAM_ERROR]: '参数错误',
}

// ==================== 工具函数 ====================

/**
 * 根据错误码获取友好的错误消息
 * @param code 错误码（ErrorCodeEnum 或数字）
 * @param fallbackMessage 自定义回退消息（可选）
 * @returns 用户友好的错误提示文本
 *
 * @example
 * ```typescript
 * getErrorMessage(ErrorCodeEnum.UNAUTHORIZED)        // '未授权'
 * getErrorMessage(ErrorCodeEnum.TOKEN_EXPIRED)         // 'Token已过期'
 * getErrorMessage(9999, '未知错误')                    // '未知错误'
 * getErrorMessage(401)                                 // '未授权'（兼容 HTTP 状态码）
 * ```
 */
export function getErrorMessage(code: number, fallbackMessage?: string): string {
  // 优先从 ErrorMessageMap 查找
  if (code in ErrorMessageMap) {
    return ErrorMessageMap[code] || '操作成功'
  }

  // 兼容常见 HTTP 状态码（不在 ErrorCodeEnum 中的）
  const httpStatusMessages: Record<number, string> = {
    201: '创建成功',
    204: '无内容',
    405: '请求方法不被允许',
    408: '请求超时',
    409: '数据冲突',
    413: '请求实体过大',
    429: '请求过于频繁',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
  }

  return httpStatusMessages[code] || fallbackMessage || '系统发生未知错误，请稍后重试'
}

/**
 * 判断是否为操作成功
 * @param code 业务错误码
 * @returns 是否成功（code === 0，与后端约定一致）
 *
 * @example
 * ```typescript
 * if (isSuccessCode(response.code)) {
 *   // 处理成功响应
 * }
 * ```
 */
export function isSuccessCode(code: number): boolean {
  return code === ErrorCodeEnum.SUCCESS
}

/**
 * 判断是否为 Token 相关错误（需要触发刷新机制）
 * @param code 错误码
 * @returns 是否为 Token 过期/无效错误
 *
 * @example
 * ```typescript
 * if (isTokenError(response.code)) {
 *   // 触发 Token 刷新流程
 * }
 * ```
 */
export function isTokenError(code: number): boolean {
  return (
    code === ErrorCodeEnum.TOKEN_EXPIRED ||
    code === ErrorCodeEnum.TOKEN_INVALID ||
    code === ErrorCodeEnum.UNAUTHORIZED
  )
}

/**
 * 判断是否为网络错误（无法连接到服务器）
 * @description 精准判断真正的网络层面错误，排除已单独处理的超时错误
 *
 * 核心原则：
 * - 只有当请求**没有拿到后端响应**时，才判定为真正的网络错误
 * - 如果有 response 对象（哪怕是 400/500），都应该按 HTTP 错误处理
 *
 * @param error Axios 错误对象
 * @returns 是否为网络层面的错误（不包括超时、不包括有响应的 HTTP 错误）
 *
 * @example
 * ```typescript
 * try {
 *   await http.get({ url: '/api/data' })
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     console.log('真正无法连接到服务器')
 *   }
 * }
 * ```
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as {
    code?: string
    message?: string
    response?: unknown
  }

  // 只要拿到了后端响应（任何状态码），都不是"网络错误"
  if (err.response) return false

  return (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ECONNRESET' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EHOSTUNREACH' ||
    err.message?.includes('Network Error') ||
    err.message?.includes('Failed to fetch') ||
    false
  )
}

/**
 * 判断是否为客户端错误（4xx）
 * @param code 错误码或 HTTP 状态码
 * @returns 是否为客户端错误
 */
export function isClientError(code: number): boolean {
  return code >= 400 && code < 500
}

/**
 * 判断是否为服务器错误（5xx）
 * @param code 错误码或 HTTP 状态码
 * @returns 是否为服务器错误
 */
export function isServerError(code: number): boolean {
  return code >= 500 && code < 600
}

/**
 * 获取错误类型分类
 * @param code 错误码
 * @returns 错误类型描述
 *
 * @example
 * ```typescript
 * getErrorType(ErrorCodeEnum.TOKEN_EXPIRED)  // 'token'
 * getErrorType(ErrorCodeEnum.USER_NOT_FOUND)  // 'user'
 * getErrorType(ErrorCodeEnum.PARAM_ERROR)     // 'param'
 * ```
 */
export function getErrorType(
  code: number,
): 'http' | 'user' | 'captcha' | 'token' | 'permission' | 'param' | 'unknown' {
  if (code >= 400 && code < 600) return 'http'
  if (code >= 1001 && code < 2000) return 'user'
  if (code >= 2001 && code < 3000) return 'captcha'
  if (code >= 3001 && code < 4000) return 'token'
  if (code >= 4001 && code < 5000) return 'permission'
  if (code >= 5001 && code < 6000) return 'param'
  return 'unknown'
}

// ==================== 类型导出（向后兼容）====================

/** @deprecated 使用 ErrorCodeEnum 替代 */
export type ErrorCode = ErrorCodeEnum

/** @deprecated 直接使用 ErrorCodeEnum 中的值即可 */
export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}
