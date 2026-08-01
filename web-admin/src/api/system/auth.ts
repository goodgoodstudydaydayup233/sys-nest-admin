/**
 * 认证相关 API 接口
 * @description 用户登录、登出、Token 刷新、验证码等认证相关接口
 *
 * @example 使用示例
 * ```typescript
 * import { authApi } from '@/api/system'
 *
 * // 用户登录 - 直接返回 LoginResult 对象
 * const { accessToken, refreshToken } = await authApi.login({
 *   username: 'admin',
 *   password: '123456',
 *   captcha: 'abcd',
 *   captchaKey: 'key_xxx'
 * })
 *
 * // 获取验证码 - 直接返回 CaptchaResult 对象
 * const { image, key } = await authApi.getCaptcha()
 * ```
 */

import http from '@/utils/request'

// ==================== 类型定义 ====================

/** 登录请求参数 */
export interface LoginParams {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 验证码文本 */
  captcha?: string
  /** 验证码 Key（与服务端返回的一致）*/
  captchaKey?: string
  /** 是否记住我（延长 Token 有效期）*/
  rememberMe?: boolean
}

/** 登录成功响应数据（自动从 {code, msg, data} 中解包出 data 内容）*/
export interface LoginResult {
  /** 访问令牌（短 Token，过期时间较短）*/
  accessToken: string
  /** 刷新令牌（长 Token，用于无感刷新）*/
  refreshToken: string
}

/** Token 对（自动解包）*/
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/** 验证码结果（自动解包）*/
export interface CaptchaResult {
  /** 验证码图片内容（SVG 字符串或 Base64 编码，由后端决定格式）*/
  image: string
  /** 验证码唯一标识（提交时需带回）*/
  key: string
  /** 过期时间（秒）*/
  expire: number
}

/** 用户信息（自动解包）*/
export interface UserInfo {
  /** 用户 ID */
  id: number | string
  /** 用户名 */
  username: string
  /** 昵称 */
  nickname?: string
  /** 头像 URL */
  avatar?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 性别: 0-男 1-女 3-未知 */
  sex?: string
  /** 角色列表 */
  roles?: string[]
  /** 权限标识列表 */
  permissions?: string[]
  /** 创建时间 */
  createdAt?: string
  /** 最后登录时间 */
  lastLoginAt?: string
}

/**
 * 路由信息（后端 buildMenus 返回的 Vue Router 兼容结构）
 * @description 对应后端 AuthService.getRouters() → buildMenus() 返回的树形结构
 *
 * @example
 * ```typescript
 * const routes: RouterInfo[] = await authApi.getRouters()
 * routes.forEach((route) => {
 *   console.log(route.path, route.meta?.title, route.children?.length)
 * })
 * ```
 */
export interface RouterInfo {
  /** 是否隐藏: true-隐藏 false-显示 */
  hidden: boolean
  /** 路由名称（首字母大写的 path） */
  name: string
  /** 路由地址 */
  path: string
  /** 组件路径: 'Layout' | 'ParentView' | 'InnerLink' | 实际组件路径 */
  component: string
  /** 路由参数 */
  query: string
  /** 路由元信息，菜单框架类型时为 null */
  meta: {
    /** 菜单标题 */
    title: string
    /** 菜单图标 */
    icon: string
    /** 是否不缓存: true-不缓存 false-缓存 */
    noCache: boolean
    /** 外链地址（外链菜单时存在） */
    link?: string
    /** 内嵌外链的真实地址（InnerLink 子路由时存在） */
    path?: string
  } | null
  /** 是否始终显示根菜单（目录类型时为 true） */
  alwaysShow?: boolean
  /** 重定向地址（目录类型时为 'noRedirect'） */
  redirect?: string
  /** 子路由列表 */
  children?: RouterInfo[]
}

// ==================== API 接口定义 ====================

export const authApi = {
  /**
   * 用户登录
   * @param loginData 登录信息
   * @returns Token 信息和用户基本信息（已解包，直接使用）
   *
   * @example
   * ```typescript
   * // 服务端返回: { code: 0, msg: null, data: { accessToken: "...", refreshToken: "..." } }
   * // 直接使用返回值:
   * const result = await authApi.login({ username: 'admin', password: '123456' })
   * console.log(result.accessToken)  // 直接访问，无需 .data
   * console.log(result.refreshToken) // 直接访问
   * ```
   */
  login(loginData: LoginParams): Promise<LoginResult> {
    return http.post<LoginResult>({
      url: '/auth/login',
      data: loginData,
      skipAuth: true,
    })
  },

  /**
   * 刷新 Access Token
   * @param refreshToken 刷新令牌
   * @returns 新的 Token 对（已解包）
   *
   * @note 此方法通常由拦截器自动调用，一般不需要手动调用
   */
  refreshToken(refreshToken: string): Promise<TokenPair> {
    return http.post<TokenPair>({
      url: '/auth/refresh-token',
      data: { refreshToken },
      skipAuth: true,
    })
  },

  /**
   * 获取验证码图片
   * @returns 验证码图片的 Base64 数据和 Key（已解包）
   *
   * @example
   * ```typescript
   * // 服务端返回: { code: 0, msg: null, data: { image: "...", key: "..." } }
   * // 直接使用:
   * const { image, key } = await authApi.getCaptcha()
   * captchaUrl.value = `data:image/png;base64,${image}`
   * ```
   */
  getCaptcha(): Promise<CaptchaResult | null> {
    return http.get<CaptchaResult | null>({
      url: '/captcha',
      skipAuth: true,
    })
  },

  /**
   * 用户登出
   * @note 清除本地 Token 并通知服务端失效
   */
  logout(): Promise<void> {
    return http.post<void>({
      url: '/auth/logout',
    })
  },

  /**
   * 获取当前用户信息
   * @returns 完整的用户信息（已解包，权限、角色等）
   *
   * @example
   * ```typescript
   * // 服务端返回: { code: 0, msg: null, data: { id: 1, username: "admin", ... } }
   * // 直接使用:
   * const user = await authApi.getUserInfo()
   * console.log(user.username)  // 无需 .data
   * ```
   */
  getUserInfo(): Promise<UserInfo> {
    return http.get<UserInfo>({
      url: '/auth/userInfo',
    })
  },

  /**
   * 获取当前用户的路由菜单
   * @description GET /auth/getRouters，根据用户角色返回有权限的菜单树
   * @returns 路由菜单树形列表（已解包 data）
   *
   * @example
   * ```typescript
   * const routes = await authApi.getRouters()
   * console.log('共', routes.length, '个顶级路由')
   * ```
   */
  getRouters(): Promise<RouterInfo[]> {
    return http.get<RouterInfo[]>({
      url: '/auth/getRouters',
    })
  },
}

export default authApi
