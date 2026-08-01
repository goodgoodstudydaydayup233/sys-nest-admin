/**
 * Axios 请求实例封装
 * @description
 * - 统一请求/响应拦截器
 * - 自动注入 Authorization Token
 * - 无感 Token 刷新机制（排队重试）
 * - 统一错误处理和提示
 * - 请求取消（防重复提交）
 *
 * @example 基础用法
 * ```typescript
 * import { request } from '@/utils/request'
 *
 * // GET 请求
 * const res = await request.get('/dev-api/users')
 *
 * // POST 请求
 * const res = await request.post('/dev-api/login', { username, password })
 * ```
 */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type Canceler,
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Router } from 'vue-router'

import {
  ErrorCodeEnum,
  getErrorMessage,
  isTokenError,
  isNetworkError,
  isSuccessCode,
} from './errorCode'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/auth'
import { filterEmptyFields } from '@/utils/filter'

// ==================== 类型定义 ====================

/** 后端标准响应数据结构 */
export interface ApiResponse<T = unknown> {
  /** 业务错误码：0 表示成功，其他值表示错误（对应 ErrorCodeEnum）*/
  code: number
  /** 提示消息（支持字符串或字符串数组） */
  msg: string | string[] | null
  /** 响应数据 */
  data: T
}

/** 扩展的请求配置（支持自定义选项）*/
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否显示错误提示（默认 true）*/
  showError?: boolean
  /** 是否显示加载状态（默认 false）*/
  showLoading?: boolean
  /** 是否跳过 Token 注入（用于登录等公开接口）*/
  skipAuth?: boolean
  /** 是否为文件上传（自动设置 Content-Type）*/
  isUpload?: boolean
  /** 自定义成功判断逻辑 */
  validateStatus?: (code: number) => boolean
  /** 是否启用防重复请求（默认 true）*/
  preventDuplicate?: boolean
}

/** Token 刷新状态管理 */
interface RefreshState {
  /** 是否正在刷新 Token */
  isRefreshing: boolean
  /** 等待队列（存储因 Token 过期而挂起的请求）*/
  subscribers: Array<(token: string | null) => void>
}

// ==================== 配置常量 ====================

/** 请求超时时间（毫秒）*/
const REQUEST_TIMEOUT = 15000

/** Token 刷新接口地址 */
const REFRESH_TOKEN_URL = '/auth/refresh-token'

// ==================== 状态管理 ====================

/** Token 刷新状态（单例，确保全局唯一）*/
const refreshState: RefreshState = {
  isRefreshing: false,
  subscribers: [],
}

/** 用于存储每个请求的取消函数（防重复请求）*/
const pendingRequests = new Map<string, Canceler>()

/** Router 实例（用于页面跳转）*/
let routerInstance: Router | null = null

// ==================== 工具函数 ====================

/**
 * 设置 Router 实例
 * @description 在应用初始化时调用，用于后续的页面跳转
 * @param router Vue Router 实例
 *
 * @example
 * ```typescript
 * // main.ts 或 router/index.ts
 * import { setRouter } from '@/utils/request/service'
 * import router from './router'
 *
 * setRouter(router)
 * ```
 */
export function setRouter(router: Router): void {
  routerInstance = router
}

/**
 * 清除所有 Token 并跳转登录页
 * @param reason 跳转原因（可选，用于日志记录）
 */
function clearTokensAndRedirect(reason?: string) {
  clearTokens()

  console.warn(`[Auth] ${reason || 'Token 已清除，跳转到登录页'}`)

  const currentPath = window.location.pathname + window.location.search
  const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`

  if (routerInstance) {
    routerInstance.push(redirectUrl).catch((err) => {
      if (!err.message.includes('redundant navigation')) {
        console.error('[Navigation Error]', err)
      }
    })
  } else {
    window.location.href = redirectUrl
  }
}

/**
 * 生成请求的唯一标识（用于取消重复请求）
 */
function generateRequestKey(config: InternalAxiosRequestConfig): string {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/**
 * 添加待处理的请求到等待队列
 * 当 Token 刷新完成后，依次执行这些请求
 * @param callback 回调函数，参数为新 Token（失败时为 null）
 */
function addRefreshSubscriber(callback: (token: string | null) => void): void {
  refreshState.subscribers.push(callback)
}

/**
 * 通知所有等待中的请求执行（Token 刷新后调用）
 * @param token 新的 Access Token（刷新失败时传入 null）
 */
function onRefreshed(token: string | null): void {
  refreshState.subscribers.forEach((callback) => callback(token))
  refreshState.subscribers = []
}

// ==================== 创建 Axios 实例 ====================

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/dev-api',
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// ==================== 请求拦截器 ====================

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestConfig = config as RequestConfig

    // 处理文件上传（移除 Content-Type，让浏览器自动设置 multipart/form-data）
    if (requestConfig.isUpload) {
      delete requestConfig.headers?.['Content-Type']
    }

    // 过滤无效参数（空字符串、null、undefined）
    if (config.params && typeof config.params === 'object') {
      config.params = filterEmptyFields(config.params)
    }
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = filterEmptyFields(config.data)
    }

    // 跳过 Token 注入（登录、获取验证码等公开接口）
    if (!requestConfig.skipAuth) {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // 防重复请求：检查是否已启用（默认启用）
    const shouldPreventDuplicate = requestConfig.preventDuplicate !== false

    if (shouldPreventDuplicate) {
      const requestKey = generateRequestKey(config)

      if (pendingRequests.has(requestKey)) {
        const cancel = pendingRequests.get(requestKey)!
        cancel('请求已取消：存在相同的请求正在进行')
        pendingRequests.delete(requestKey)
      }

      config.cancelToken = new axios.CancelToken((cancel) => {
        pendingRequests.set(requestKey, cancel)
      })
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ==================== 响应拦截器 ====================

service.interceptors.response.use(
  /**
   * 响应成功处理（HTTP 状态码 2xx）
   * @description 检查业务错误码，处理 Token 刷新等逻辑
   */
  async (response: AxiosResponse<ApiResponse>) => {
    const { config, data } = response
    const requestConfig = config as RequestConfig

    // 从待处理列表中移除已完成的请求
    const requestKey = generateRequestKey(config)
    pendingRequests.delete(requestKey)

    // 安全检查：确保响应数据是对象类型且包含 code 字段
    if (!data || typeof data !== 'object' || !('code' in data)) {
      // 后端返回的不是标准 ApiResponse 结构（可能是纯文本、文件流等）
      // 直接将原始 response 返回，让业务层处理
      return response
    }

    // 判断业务是否成功（根据后端约定：code === 0）
    const isSuccess = requestConfig.validateStatus
      ? requestConfig.validateStatus(data.code)
      : isSuccessCode(data.code)

    if (isSuccess) {
      // 成功：返回完整的 ApiResponse 对象（由 index.ts 解包 data 字段）
      return data as unknown as ApiResponse
    }

    // ==================== 错误处理 ====================

    // Token 相关错误 → 触发无感刷新
    if (isTokenError(data.code) && !requestConfig.skipAuth) {
      return handleTokenExpired(response)
    }

    // 其他业务错误 → 使用后端 msg 通知用户（无 msg 时回退到错误码映射）
    if (requestConfig.showError !== false) {
      const msg = data.msg
      if (Array.isArray(msg)) {
        msg.forEach((item) => ElMessage.error(item))
      } else {
        ElMessage.error(msg || getErrorMessage(data.code))
      }
    }

    const errorMsg = Array.isArray(data.msg)
      ? data.msg.join('；')
      : data.msg || getErrorMessage(data.code)
    const error = new Error(errorMsg) as Error & {
      code: number
      response: AxiosResponse
    }
    error.code = data.code
    error.response = response
    return Promise.reject(error)
  },

  /**
   * 响应失败处理（HTTP 状态码非 2xx 或网络错误）
   */
  async (error: any) => {
    const { config, response, code, message } = error
    const requestConfig = (config || {}) as RequestConfig

    // 从待处理列表中移除失败的请求
    if (config) {
      const requestKey = generateRequestKey(config)
      pendingRequests.delete(requestKey)
    }

    // 请求被主动取消（不显示错误）
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    // 有 response 的 HTTP 错误（拿到了后端响应）
    if (response) {
      return handleHttpError(error, requestConfig)
    }

    // 请求超时
    if (code === 'ECONNABORTED' && message?.includes('timeout')) {
      if (requestConfig.showError !== false) {
        ElMessage.warning('请求超时，请检查网络后重试')
      }

      const timeoutError = new Error('请求超时') as Error & {
        code: string
        isTimeout: boolean
      }
      timeoutError.code = 'TIMEOUT_ERROR'
      timeoutError.isTimeout = true
      return Promise.reject(timeoutError)
    }

    // 网络错误（无法连接到服务器）
    if (isNetworkError(error)) {
      if (requestConfig.showError !== false) {
        ElMessage.error('网络连接失败，请检查网络后重试')
      }

      const networkError = new Error('网络连接失败') as Error & {
        code: string
        isNetworkError: boolean
      }
      networkError.code = 'NETWORK_ERROR'
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    }

    // 未知错误
    let userMessage = '请求发生异常，请稍后重试'
    if (message?.includes('JSON')) {
      userMessage = '服务器返回数据格式错误'
    } else if (code === 'ERR_CORS' || message?.includes('CORS')) {
      userMessage = '跨域请求被阻止，请检查服务端配置'
    }

    if (requestConfig.showError !== false) {
      ElMessage.error(userMessage)
    }

    const unknownError = new Error(userMessage) as Error & {
      code: string
      isUnknown: boolean
    }
    unknownError.code = code || 'UNKNOWN_ERROR'
    unknownError.isUnknown = true
    return Promise.reject(unknownError)
  },
)

// ==================== 辅助方法：HTTP 错误统一处理 ====================

/**
 * 处理 HTTP 状态码错误
 * @param error Axios 错误对象
 * @param requestConfig 请求配置
 */
function handleHttpError(
  error: { response: AxiosResponse; config?: any },
  requestConfig: RequestConfig,
): Promise<unknown> {
  const { response } = error
  const { status, data: responseData } = response

  // 401 未认证 → 尝试刷新 Token
  if (status === ErrorCodeEnum.UNAUTHORIZED && requestConfig.skipAuth !== true) {
    return handleTokenExpired({ ...error, response })
  }

  // 尝试从后端响应中提取错误消息
  const backendMessage =
    responseData && typeof responseData === 'object'
      ? responseData.msg || responseData.message
      : null

  const errorMessage = Array.isArray(backendMessage)
    ? backendMessage.join('；')
    : backendMessage || getErrorMessage(status)

  if (requestConfig.showError !== false) {
    if (Array.isArray(backendMessage)) {
      backendMessage.forEach((item: string) => ElMessage.error(item))
    } else {
      ElMessage.error(errorMessage)
    }
  }

  const httpError = new Error(errorMessage) as Error & {
    statusCode: number
    response: AxiosResponse
  }
  httpError.statusCode = status
  httpError.response = response
  return Promise.reject(httpError)
}

// ==================== 核心方法：无感 Token 刷新 ====================

/**
 * 处理 Token 过期
 * @description 实现无感刷新机制：
 * 1. 首次遇到 401 时触发 Token 刷新
 * 2. 后续请求加入等待队列
 * 3. Token 刷新成功后，重新发送所有排队请求
 * 4. Token 刷新失败则清除状态并跳转登录页
 */
async function handleTokenExpired(errorResponse: any): Promise<any> {
  const { config } = errorResponse

  // 如果正在刷新，将当前请求加入等待队列
  if (refreshState.isRefreshing) {
    return new Promise((resolve, reject) => {
      addRefreshSubscriber((token: string | null) => {
        if (!token) {
          const error = new Error('Token 刷新失败') as Error & {
            code: number
            isRefreshFailed: boolean
          }
          error.code = 401
          error.isRefreshFailed = true
          return reject(error)
        }

        config.headers.Authorization = `Bearer ${token}`
        resolve(service(config))
      })
    })
  }

  // 标记开始刷新
  refreshState.isRefreshing = true

  try {
    const refreshTokenValue = getRefreshToken()
    if (!refreshTokenValue) {
      throw new Error('No refresh token available')
    }

    // 使用原始 axios 发起刷新请求（避免循环依赖）
    const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      REFRESH_TOKEN_URL,
      { refreshToken: refreshTokenValue },
      {
        baseURL: import.meta.env.VITE_API_BASE_URL || '/dev-api',
      },
    )

    const tokenData = response.data.data

    // 更新本地存储的 Token
    setTokens(tokenData.accessToken, tokenData.refreshToken)

    // 通知所有等待中的请求使用新 Token 重试
    onRefreshed(tokenData.accessToken)

    // 当前请求用新 Token 重试
    config.headers.Authorization = `Bearer ${tokenData.accessToken}`
    return service(config)
  } catch (refreshError) {
    // Token 刷新失败 → 清除状态并跳转登录页
    onRefreshed(null)
    clearTokensAndRedirect('Token 刷新失败')

    setTimeout(() => {
      ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          window.location.href = '/login'
        })
        .catch(() => {})
    }, 100)

    return Promise.reject(refreshError)
  } finally {
    refreshState.isRefreshing = false
  }
}

// ==================== 导出实例和方法 ====================

export default service

/**
 * 获取原始 Axios 实例（不经过响应拦截器的简化版）
 * @description 用于特殊场景（如下载文件、上传进度等）
 */
export function getRawInstance(): AxiosInstance {
  return axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/dev-api',
    timeout: REQUEST_TIMEOUT,
  })
}
