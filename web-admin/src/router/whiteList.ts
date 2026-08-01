/**
 * 路由白名单配置
 * @description 配置无需登录即可访问的页面路径（包括所有错误页面）
 */
export const WHITE_LIST = [
  '/login',
  '/register',
  '/forgot-password',
  // 错误页面（无需登录）
  '/404',
  '/403',
  '/500',
  '/network-error',
  '/maintenance',
]

/**
 * 默认首页路径
 */
export const DEFAULT_HOME_PATH = '/dashboard'

/**
 * 默认登录页路径
 */
export const LOGIN_PATH = '/login'

/**
 * 错误页面路径映射
 * @description 根据HTTP状态码或错误类型获取对应的错误页面路径
 */
export const ERROR_PAGE_MAP: Record<string, string> = {
  '404': '/404',
  '403': '/403',
  '500': '/500',
  'network': '/network-error',
  'maintenance': '/maintenance',
}
