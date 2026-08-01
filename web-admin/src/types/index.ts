/**
 * 全局类型定义
 * @description 存放项目中通用的 TypeScript 类型接口
 */

/** API 响应基础结构（与后端保持一致：msg 字段） */
export interface ApiResponse<T = any> {
  code: number
  msg: string | null
  data: T
}

/**
 * 分页请求参数
 * @description 后端 BasePaginationDto 对应的前端分页请求基础类型
 * 所有分页查询接口均应继承或使用此类型
 *
 * @example
 * ```typescript
 * const params: PageParams = { page: 1, pageSize: 10 }
 * ```
 */
export interface PageParams {
  /** 当前页码（从 1 开始） */
  page: number
  /** 每页条数 */
  pageSize: number
}

/**
 * 分页响应数据（后端统一格式）
 * @description 后端 data 字段解包后的内容，结构固定为 { total, list }
 * 所有分页接口返回类型均应使用此泛型包装
 *
 * @example
 * ```typescript
 * // 后端返回: { code: 200, msg: null, data: { total: 100, list: [...] } }
 * // http.get 自动解包 data，业务层直接拿到 PaginationResult
 * const result: PaginationResult<UserVo> = await http.get({ url: '/dev-api/user', params })
 * console.log(result.total) // 100
 * console.log(result.list)  // [...]
 * ```
 */
export interface PaginationResult<T = unknown> {
  /** 数据列表 */
  list: T[]
  /** 总记录数 */
  total: number
}

/**
 * @deprecated 请使用 PaginationResult 替代
 * 保留旧类型以兼容存量代码，新接口统一使用 PaginationResult
 */
export type PageResult<T = unknown> = PaginationResult<T> & {
  page: number
  pageSize: number
}

/** 菜单项 */
export interface MenuItem {
  id: string | number
  name: string
  path: string
  component?: string
  icon?: string
  parentId?: string | number | null
  sort?: number
  visible?: boolean
  children?: MenuItem[]
  meta?: {
    title: string
    icon?: string
    hidden?: boolean
    keepAlive?: boolean
    affix?: boolean
  }
}

/** 用户信息 */
export interface UserInfo {
  id: string | number
  username: string
  nickname: string
  avatar: string
  email?: string
  phone?: string
  roles: string[]
  permissions: string[]
}

/** 登录参数 */
export interface LoginParams {
  username: string
  password: string
  captcha?: string
  captchaKey?: string
}

/** 登录响应 */
export interface LoginResult {
  token: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * 路由元信息
 * @description 统一定义路由 meta 字段，供路由守卫、侧边栏、面包屑、标签页等模块使用
 * 参考若依/芋道开源项目规范
 *
 * @property title       页面标题（侧边栏/面包屑/浏览器标签页共用）
 * @property icon        菜单图标名称（对应 iconMap 中的 key）
 * @property noCache     设为 true 则不被 <keep-alive> 缓存（默认 false）
 * @property affix       标签页固定不可关闭（默认 false）
 * @property noTagsView  设为 true 则不出现在标签页中（默认 false）
 * @property breadcrumb  设为 false 则不在面包屑中显示（默认 true）
 * @property activeMenu  高亮的菜单路径（用于详情页等场景指向父级菜单）
 * @property followAuth  跟随哪个路由进行权限过滤
 * @property canTo       设为 true 即使 hidden 为 true 也允许路由跳转（默认 false）
 * @property keepAlive   是否开启页面缓存（默认 false）
 */
export interface RouteMeta {
  title?: string
  icon?: string
  noCache?: boolean
  affix?: boolean
  noTagsView?: boolean
  breadcrumb?: boolean
  activeMenu?: string
  followAuth?: string
  canTo?: boolean
  keepAlive?: boolean
  link?: string
  path?: string
}

/**
 * 路由自定义顶级属性
 * @description hidden、alwaysShow、roles、permissions、query 等应与 path 同级，
 * 遵循若依/芋道开源项目规范
 *
 * @property hidden       当设置 true 的时候该路由不会再侧边栏出现
 * @property alwaysShow   强制始终显示根路由目录（即使只有一个子路由）
 * @property roles        访问路由的角色权限
 * @property permissions  访问路由的菜单权限
 * @property query        访问路由的默认传递参数
 */
export interface CustomRouteRecord {
  hidden?: boolean
  alwaysShow?: boolean
  roles?: string[]
  permissions?: string[]
  query?: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    noCache?: boolean
    affix?: boolean
    noTagsView?: boolean
    breadcrumb?: boolean
    activeMenu?: string
    followAuth?: string
    canTo?: boolean
    keepAlive?: boolean
    link?: string
    path?: string
  }

  /** 扩展路由顶级自定义属性（与 path 同级） */
  interface _RouteRecordBase {
    /** 路由是否在侧边栏隐藏（默认 false） */
    hidden?: boolean
    /** 强制始终显示根路由目录（即使只有一个子路由） */
    alwaysShow?: boolean
    /** 访问路由的角色权限 */
    roles?: string[]
    /** 访问路由的菜单权限 */
    permissions?: string[]
    /** 访问路由的默认传递参数 */
    query?: string
  }
}
