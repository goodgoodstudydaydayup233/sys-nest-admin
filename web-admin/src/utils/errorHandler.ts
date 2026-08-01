/**
 * 错误页面导航工具
 * @description 提供统一的错误页面跳转方法，支持根据状态码自动选择对应页面
 */
import { ERROR_PAGE_MAP } from '@/router/whiteList'
import type { Router } from 'vue-router'

/**
 * 跳转到指定的错误页面
 * @param router Vue Router 实例
 * @param errorType 错误类型（'404' | '403' | '500' | 'network' | 'maintenance'）
 * @param options 可选配置
 */
export function navigateToErrorPage(
  router: Router,
  errorType: keyof typeof ERROR_PAGE_MAP,
  options?: {
    replace?: boolean
    query?: Record<string, string>
  }
) {
  const path = ERROR_PAGE_MAP[errorType] || '/404'
  
  if (options?.replace) {
    router.replace({
      path,
      query: options?.query,
    })
  } else {
    router.push({
      path,
      query: options?.query,
    })
  }
}

/**
 * 根据HTTP状态码跳转到对应错误页
 * @param router Vue Router 实例
 * @param statusCode HTTP状态码（404, 403, 500等）
 * @param message 错误信息（可选，会传递给错误页）
 */
export function handleErrorByStatus(
  router: Router,
  statusCode: number,
  message?: string
) {
  const statusStr = statusCode.toString()
  
  if (statusStr in ERROR_PAGE_MAP) {
    navigateToErrorPage(router, statusStr as keyof typeof ERROR_PAGE_MAP, {
      replace: true,
      query: message ? { message } : undefined,
    })
  } else {
    // 其他未知错误都跳转到500页面
    navigateToErrorPage(router, '500', {
      replace: true,
      query: { 
        code: statusStr, 
        ...(message ? { message } : {}),
      },
    })
  }
}

/**
 * 网络错误处理
 * @param router Vue Router 实例
 * @param error 错误对象或消息
 */
export function handleNetworkError(router: Router, error?: Error | string) {
  const message = typeof error === 'string' ? error : error?.message
  
  navigateToErrorPage(router, 'network', {
    replace: true,
    query: message ? { message } : undefined,
  })
}
