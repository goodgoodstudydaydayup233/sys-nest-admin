/**
 * Token 认证管理工具
 * @description
 * 统一管理 Access Token / Refresh Token 的本地存储操作
 * 所有需要读写 Token 的地方（Store、请求拦截器、路由守卫等）都应通过本模块操作
 *
 * @example
 * ```typescript
 * import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/auth'
 *
 * // 登录成功后存储 Token
 * setTokens(data.accessToken, data.refreshToken)
 *
 * // 请求拦截器中获取 Token
 * const token = getAccessToken()
 *
 * // 登出时清除 Token
 * clearTokens()
 * ```
 */

/** Access Token 存储键名 */
const ACCESS_TOKEN_KEY = 'access_token'

/** Refresh Token 存储键名 */
const REFRESH_TOKEN_KEY = 'refresh_token'

/**
 * 获取 Access Token
 * @returns Access Token 字符串，不存在时返回空字符串
 *
 * @example
 * ```typescript
 * const token = getAccessToken()
 * if (token) {
 *   // 已登录
 * }
 * ```
 */
export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

/**
 * 获取 Refresh Token
 * @returns Refresh Token 字符串，不存在时返回空字符串
 *
 * @example
 * ```typescript
 * const refreshToken = getRefreshToken()
 * ```
 */
export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

/**
 * 存储 Token 对到本地
 * @param accessToken Access Token（必填）
 * @param refreshToken Refresh Token（可选，不传则只更新 Access Token）
 *
 * @example
 * ```typescript
 * // 登录成功
 * setTokens(response.accessToken, response.refreshToken)
 *
 * // 仅刷新 Access Token
 * setTokens(newAccessToken)
 * ```
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

/**
 * 清除所有 Token（Access Token + Refresh Token）
 * @description 登出或 Token 刷新失败时调用
 *
 * @example
 * ```typescript
 * clearTokens()
 * router.push('/login')
 * ```
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * 判断是否存在有效的 Access Token
 * @returns 是否已存储 Token（不校验 Token 是否过期）
 *
 * @example
 * ```typescript
 * if (hasToken()) {
 *   // 认为已登录，尝试获取用户信息
 * }
 * ```
 */
export function hasToken(): boolean {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY)
}
