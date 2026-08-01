/**
 * 全局应用配置
 * @description 集中管理应用的全局配置项，支持环境变量动态配置
 * @author sys-nest-admin Team
 * @version 1.0.0
 */

/**
 * 应用全局配置接口
 */
interface AppConfig {
  appTitle: string
  appVersion: string
  apiBaseUrl: string
  apiTimeout: number
  port: number
  isDev: boolean
  isProd: boolean
  showTips: boolean
  verbose: boolean
  sourceMap: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  defaultTheme: string
  permissionButton: boolean
  useMock: boolean
  /** 超级管理员用户名（拥有全部权限，跳过权限校验） */
  superAdmin: string
}

/**
 * 应用全局配置对象
 * 从环境变量读取配置，提供默认值和类型安全访问
 */
const config: AppConfig = {
  /** 应用标题 */
  appTitle: import.meta.env.VITE_APP_TITLE || 'sys-nest-admin',

  /** 应用版本号 */
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',

  /** API 基础地址（开发环境 /dev-api，生产环境 /prod-api） */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/dev-api',

  /** API 请求超时时间（毫秒） */
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,

  /** 开发服务器端口 */
  port: Number(import.meta.env.VITE_PORT) || 5173,

  /** 是否为开发环境 */
  isDev: import.meta.env.VITE_APP_ENV === 'development',

  /** 是否为生产环境 */
  isProd: import.meta.env.VITE_APP_ENV === 'production',

  /** 是否显示开发提示 */
  showTips: import.meta.env.VITE_SHOW_TIPS !== 'false',

  /** 是否显示详细日志（仅开发环境生效） */
  verbose: import.meta.env.VITE_VERBOSE === 'true',

  /** 是否生成 Source Map */
  sourceMap: import.meta.env.VITE_SOURCE_MAP === 'true',

  /** 日志级别 */
  logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['logLevel']) || 'info',

  /** 默认主题模式 */
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',

  /** 是否启用权限按钮控制 */
  permissionButton: import.meta.env.VITE_PERMISSION_BUTTON !== 'false',

  /** 是否使用 Mock 数据 */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',

  /** 超级管理员用户名（拥有全部权限，跳过权限校验） */
  superAdmin: import.meta.env.VITE_SUPER_ADMIN || 'admin',
}

export default config

/**
 * 获取 API 完整地址
 * @param path 接口路径（如 /user/list）
 * @returns 完整的 API 地址
 *
 * @example
 * ```typescript
 * getApiUrl('/user/list') // 开发环境: http://localhost:3000/dev-api/user/list
 * getApiUrl('/user/list') // 生产环境: /prod-api/user/list
 * ```
 */
export function getApiUrl(path: string): string {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '')
  const cleanPath = path.replace(/^\//, '')
  return `${baseUrl}/${cleanPath}`
}

/**
 * 判断当前是否为指定环境
 * @param env 环境名称
 * @returns 是否匹配
 *
 * @example
 * ```typescript
 * isEnv('development') // true/false
 * ```
 */
export function isEnv(env: string): boolean {
  return import.meta.env.VITE_APP_ENV === env
}
