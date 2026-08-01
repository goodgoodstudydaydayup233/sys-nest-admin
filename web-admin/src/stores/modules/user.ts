/**
 * User Store - 用户状态管理
 * @description 管理用户登录状态、Token、用户信息等
 * 对接真实后端 API，支持无感 Token 刷新
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type UserInfo, type LoginParams, type LoginResult } from '@/api/system'
import { usePermissionStore } from './permission'
import {
  getAccessToken,
  getRefreshToken,
  setTokens as saveTokens,
  clearTokens as removeLocalTokens,
} from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // ==================== 状态定义 ====================

  /** Access Token（用于 API 认证）*/
  const token = ref<string>(getAccessToken())

  /** Refresh Token（用于刷新 Access Token）*/
  const refreshToken = ref<string>(getRefreshToken())

  /** 用户详细信息 */
  const userInfo = ref<UserInfo | null>(null)

  /** 登录状态加载中标志 */
  const loading = ref(false)

  // ==================== 计算属性 ====================

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value)

  /** 用户名（显示用）*/
  const username = computed(() => userInfo.value?.username || 'Admin')

  /** 昵称（显示用）*/
  const nickname = computed(() => userInfo.value?.nickname || username.value)

  /** 头像 URL */
  const avatar = computed(() => userInfo.value?.avatar || '')

  /** 角色列表 */
  const roles = computed(() => userInfo.value?.roles || [])

  /** 权限标识列表 */
  const permissions = computed(() => userInfo.value?.permissions || [])

  // ==================== 核心方法 ====================

  /**
   * 用户登录
   * @param loginData 登录参数（用户名、密码、验证码等）
   * @returns 登录结果（包含 Token）
   *
   * @example
   * ```typescript
   * const userStore = useUserStore()
   * try {
   *   const result = await userStore.login({
   *     username: 'admin',
   *     password: '123456',
   *     captcha: 'abcd',
   *     captchaKey: 'key_xxx'
   *   })
   *   console.log(result.accessToken)   // 短 Token
   *   console.log(result.refreshToken)  // 长 Token
   * } catch (error) {
   *   // 显示错误信息（由拦截器统一处理）
   * }
   * ```
   */
  async function login(loginData: LoginParams): Promise<LoginResult> {
    loading.value = true

    try {
      const data = await authApi.login(loginData)

      setTokens(data.accessToken, data.refreshToken)

      await getUserInfo()

      const permissionStore = usePermissionStore()
      await permissionStore.generateRoutes()

      return data
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户完整信息
   * @description 在路由守卫中调用，确保用户信息是最新的
   * @returns 用户详细信息（已解包，直接使用）
   */
  async function getUserInfo(): Promise<UserInfo> {
    loading.value = true

    try {
      // 返回值已经是 UserInfo 对象（自动解包 data）
      const info = await authApi.getUserInfo()

      setUserInfo(info)
      return info
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取验证码
   * @returns 验证码图片 Base64 和 Key（已解包，直接使用）
   *
   * @example
   * ```typescript
   * const userStore = useUserStore()
   * const { image, key } = await userStore.getCaptcha()
   * captchaUrl.value = `data:image/png;base64,${image}`
   * captchaKey.value = key
   * ```
   */
  async function getCaptcha() {
    try {
      // 返回值已经是 CaptchaResult 对象（自动解包 data）
      return await authApi.getCaptcha()
    } catch (error) {
      console.error('获取验证码失败:', error)
      throw error
    }
  }

  /**
   * 用户登出
   * @description 清除所有本地状态并通知服务端失效 Token
   */
  async function logout() {
    try {
      // 尝试调用登出接口（即使失败也要清除本地状态）
      await authApi.logout()
    } catch (error) {
      console.warn('调用登出接口失败，仍将清除本地状态:', error)
    } finally {
      clearAllState()
    }
  }

  /**
   * 重置所有状态（强制清除）
   * @description 用于 Token 刷新失败或被踢出登录时
   */
  function resetState() {
    clearAllState()
  }

  // ==================== 内部辅助方法 ====================

  /**
   * 设置 Token 对到本地存储和状态
   */
  function setTokens(access: string, refresh?: string) {
    token.value = access
    saveTokens(access, refresh)

    if (refresh) {
      refreshToken.value = refresh
    }
  }

  /**
   * 设置用户信息
   */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  /**
   * 移除所有 Token
   */
  function removeTokens() {
    token.value = ''
    refreshToken.value = ''
    removeLocalTokens()
  }

  /**
   * 清除用户信息
   */
  function clearUserInfo() {
    userInfo.value = null
  }

  /**
   * 清除所有状态（Token + 用户信息）
   */
  function clearAllState() {
    removeTokens()
    clearUserInfo()
    const permissionStore = usePermissionStore()
    permissionStore.resetRoutes()
  }

  // ==================== 导出 ====================

  return {
    // 状态
    token,
    refreshToken,
    userInfo,
    loading,

    // 计算属性
    isLoggedIn,
    username,
    nickname,
    avatar,
    roles,
    permissions,

    // 方法
    login,
    getUserInfo,
    getCaptcha,
    logout,
    resetState,

    // 内部方法（供特殊场景使用）
    setTokens,
    removeTokens,
    setUserInfo,
    clearUserInfo,
  }
})
