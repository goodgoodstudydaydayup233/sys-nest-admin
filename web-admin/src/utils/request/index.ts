/**
 * HTTP 请求工具 - 统一导出入口
 * @description
 * 提供封装后的 axios 实例和通用请求方法
 * 所有方法自动解包后端响应的 data 字段，业务层直接使用数据
 *
 * 后端返回格式: { code: 200, msg: null, data: T }
 * 工具返回格式: T（已解包 data 字段）
 *
 * @example 基础用法
 * ```typescript
 * import http from '@/utils/request'
 *
 * // GET 请求 - 直接返回 data 内容
 * const users = await http.get<User[]>({ url: '/users', params: { page: 1 } })
 *
 * // POST 请求 - 直接返回 data 内容
 * const result = await http.post<LoginResult>({ url: '/login', data: { username, password } })
 * ```
 */

// ==================== 核心实例导出 ====================

export { default as request } from './service'
export type { RequestConfig, ApiResponse } from './service'
export { getRawInstance, setRouter } from './service'

// ==================== 错误码工具导出 ====================

export {
  ErrorCodeEnum,
  ErrorMessageMap,
  getErrorMessage,
  isTokenError,
  isNetworkError,
  isSuccessCode,
  isClientError,
  isServerError,
  getErrorType,
  HttpStatusCode,
} from './errorCode'

// 类型导出（verbatimModuleSyntax 要求）
export type { ErrorCode } from './errorCode'

// ==================== 导入核心实例和类型 ====================

import request from './service'
import type { RequestConfig, ApiResponse } from './service'
import type { AxiosResponse } from 'axios'

// ==================== 类型定义 ====================

/**
 * 通用请求选项
 * @description 基于 RequestConfig 扩展，强制要求 url 字段
 *
 * @example
 * ```typescript
 * const options: RequestOptions = {
 *   url: '/dev-api/users',
 *   method: 'GET',
 *   params: { page: 1 },
 *   skipAuth: true,
 *   showError: false,
 * }
 * ```
 */
export interface RequestOptions extends Omit<RequestConfig, 'url'> {
  /** 接口地址（必填）*/
  url: string
}

/**
 * 从响应中提取 data 字段
 * @description service.ts 成功时返回 ApiResponse 对象，需要解包 data
 * 如果响应不是标准结构（如文件流），直接返回原响应
 */
function unwrapData<T>(response: unknown): T {
  // 标准 ApiResponse 结构：{ code, msg, data }
  if (response && typeof response === 'object' && 'data' in response && 'code' in response) {
    return (response as ApiResponse<T>).data
  }
  // 非标准结构（文件流、纯文本等）直接返回
  return response as T
}

// ==================== 通用 HTTP 方法导出 ====================

const http = {
  /**
   * GET 请求
   * @param option 请求配置
   * @returns 响应数据（自动解包 data）
   *
   * @example
   * ```typescript
   * // 后端返回: { code: 0, msg: null, data: [{ id: 1, name: "test" }] }
   * const users = await http.get<User[]>({ url: '/users', params: { page: 1 } })
   * // users === [{ id: 1, name: "test" }]  直接使用
   * ```
   */
  get: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({ method: 'GET', ...option })
    return unwrapData<T>(res)
  },

  /**
   * POST 请求
   * @param option 请求配置
   * @returns 响应数据（自动解包 data）
   *
   * @example
   * ```typescript
   * // 后端返回: { code: 0, msg: null, data: { accessToken: "...", refreshToken: "..." } }
   * const result = await http.post<LoginResult>({ url: '/login', data: { username, password } })
   * // result.accessToken  直接使用
   * ```
   */
  post: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({ method: 'POST', ...option })
    return unwrapData<T>(res)
  },

  /**
   * POST 请求（返回完整响应，不解包 data）
   * @param option 请求配置
   * @returns 完整响应对象（包含 headers、status 等）
   *
   * @example
   * ```typescript
   * const response = await http.postOriginal({ url: '/export', data: filter })
   * console.log(response.headers['content-type'])
   * ```
   */
  postOriginal: async (option: RequestOptions): Promise<AxiosResponse> => {
    const res = await request({ method: 'POST', ...option })
    return res as AxiosResponse
  },

  /**
   * DELETE 请求
   * @param option 请求配置
   * @returns 响应数据（自动解包 data）
   *
   * @example
   * ```typescript
   * await http.delete({ url: `/users/${id}` })
   * ```
   */
  delete: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({ method: 'DELETE', ...option })
    return unwrapData<T>(res)
  },

  /**
   * PUT 请求
   * @param option 请求配置
   * @returns 响应数据（自动解包 data）
   *
   * @example
   * ```typescript
   * const updated = await http.put<User>({ url: `/users/${id}`, data: updateData })
   * ```
   */
  put: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({ method: 'PUT', ...option })
    return unwrapData<T>(res)
  },

  /**
   * 文件下载
   * @param option 请求配置
   * @returns Blob 数据（用于浏览器下载）
   *
   * @example
   * ```typescript
   * const blob = await http.download<Blob>({ url: '/export/excel', params: { type: 'xlsx' } })
   * const link = document.createElement('a')
   * link.href = URL.createObjectURL(blob)
   * link.download = '报表.xlsx'
   * link.click()
   * ```
   */
  download: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({
      method: 'GET',
      responseType: 'blob',
      ...option,
    })
    return res as T
  },

  /**
   * 文件上传
   * @param option 请求配置（data 为 FormData）
   * @returns 上传结果（自动解包 data）
   *
   * @example
   * ```typescript
   * const formData = new FormData()
   * formData.append('file', fileInput.files[0])
   * const result = await http.upload<{ url: string }>({ url: '/upload', data: formData })
   * console.log('文件地址:', result.url)
   * ```
   */
  upload: async <T = unknown>(option: RequestOptions): Promise<T> => {
    const res = await request({
      method: 'POST',
      ...option,
      headers: {
        ...option.headers,
        'Content-Type': 'multipart/form-data',
      },
    })
    return unwrapData<T>(res)
  },
}

export default http
