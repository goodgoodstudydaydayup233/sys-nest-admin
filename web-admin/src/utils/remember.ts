/**
 * 记住密码工具
 * @description
 * 管理「记住密码」功能的本地存储读写，密码经过混淆处理后存储，防止明文暴露
 *
 * @example 在登录页面使用
 * ```typescript
 * import { saveRememberedAccount, loadRememberedAccount, clearRememberedAccount } from '@/utils/remember'
 *
 * // 登录成功时保存
 * saveRememberedAccount('admin', '123456')
 *
 * // 页面加载时恢复
 * const saved = loadRememberedAccount()
 * if (saved) {
 *   loginForm.username = saved.username
 *   loginForm.password = saved.password
 * }
 *
 * // 取消记住时清除
 * clearRememberedAccount()
 * ```
 */
const USERNAME_KEY = 'remembered_username'
const PASSWORD_KEY = 'remembered_password'

const CIPHER_SHIFT = 3

/**
 * 混淆加密：字符偏移 + 反转 + Base64
 * @description
 * 纯前端混淆方案，用于防止 localStorage 中密码明文暴露
 * ⚠️ 不等同于服务端加密，仅防止通过 DevTools 直接读取明文
 */
function encode(plain: string): string {
  const shifted = plain
    .split('')
    .map((ch) => String.fromCharCode(ch.charCodeAt(0) + CIPHER_SHIFT))
    .reverse()
    .join('')
  return btoa(unescape(encodeURIComponent(shifted)))
}

/**
 * 解密：Base64 解码 + 反转 + 字符偏移还原
 */
function decode(encoded: string): string {
  try {
    const shifted = decodeURIComponent(escape(atob(encoded)))
    return shifted
      .split('')
      .reverse()
      .map((ch) => String.fromCharCode(ch.charCodeAt(0) - CIPHER_SHIFT))
      .join('')
  } catch {
    return ''
  }
}

/**
 * 保存「记住密码」账号信息到本地
 * @param username 用户名
 * @param password 密码（将自动加密后存储）
 *
 * @example
 * ```typescript
 * saveRememberedAccount('admin', '123456')
 * // localStorage 中 stored 值为混淆后的字符串，非明文
 * ```
 */
export function saveRememberedAccount(username: string, password: string): void {
  localStorage.setItem(USERNAME_KEY, username)
  localStorage.setItem(PASSWORD_KEY, encode(password))
}

/**
 * 读取本地记住的账号信息
 * @returns 包含 username 和 password 的对象；若无记录或解析失败则返回 null
 *
 * @example
 * ```typescript
 * const saved = loadRememberedAccount()
 * if (saved) {
 *   loginForm.username = saved.username
 *   loginForm.password = saved.password
 *   rememberPassword.value = true
 * }
 * ```
 */
export function loadRememberedAccount(): { username: string; password: string } | null {
  const username = localStorage.getItem(USERNAME_KEY)
  const encodedPwd = localStorage.getItem(PASSWORD_KEY)

  if (!username || !encodedPwd) return null

  const password = decode(encodedPwd)
  if (!password) return null

  return { username, password }
}

/**
 * 清除本地记住的账号信息
 *
 * @example
 * ```typescript
 * clearRememberedAccount()
 * ```
 */
export function clearRememberedAccount(): void {
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(PASSWORD_KEY)
}
