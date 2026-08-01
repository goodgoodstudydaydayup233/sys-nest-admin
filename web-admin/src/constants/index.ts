/**
 * 全局常量定义
 * @description 存放项目中使用的常量，避免魔法值
 */

/** Token 存储 Key */
export const TOKEN_KEY = 'access_token'

/** Refresh Token 存储 Key */
export const REFRESH_TOKEN_KEY = 'refresh_token'

/** 用户信息存储 Key */
export const USER_INFO_KEY = 'user_info'

/** Token 过期时间 Key */
export const TOKEN_EXPIRE_KEY = 'token_expire_time'

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 10

/** 分页大小选项 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** HTTP 请求状态码 */
export enum HttpStatus {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

/** 缓存时间（毫秒） */
export enum CacheTime {
  TOKEN = 24 * 60 * 60 * 1000, // 24小时
  USER_INFO = 30 * 60 * 1000,   // 30分钟
  PERMISSIONS = 30 * 60 * 1000, // 30分钟
}

/** 布局配置 */
export enum LayoutMode {
  SIDE = 'side',       // 左侧菜单布局
  TOP = 'top',         // 顶部菜单布局
  MIX = 'mix',        // 混合布局
}

/** 主题模式 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}
