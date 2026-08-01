/**
 * 主题管理工具函数
 * @description 提供主题切换、持久化存储等功能
 */

export type ThemeMode = 'light' | 'dark'

/** 本地存储键名 */
const THEME_STORAGE_KEY = 'theme-mode'

/**
 * 获取当前主题模式
 * @returns 当前激活的主题模式（light/dark）
 */
export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'light'
}

/**
 * 设置主题模式
 * @param mode 目标主题模式
 * @param persist 是否持久化到本地存储（默认 true）
 */
export function setThemeMode(mode: ThemeMode, persist: boolean = true): void {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', mode)

  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  }

  window.dispatchEvent(new CustomEvent('themechange', { detail: { mode } }))
}

/**
 * 切换主题（在 light/dark 之间切换）
 * @returns 切换后的新模式
 */
export function toggleTheme(): ThemeMode {
  const current = getThemeMode()
  const next: ThemeMode = current === 'light' ? 'dark' : 'light'
  setThemeMode(next)
  return next
}

/**
 * 初始化主题
 * @description 应用启动时调用，恢复用户上次选择的主题，默认浅色
 */
export function initTheme(): ThemeMode {
  const mode = getThemeMode()
  setThemeMode(mode, false)
  return mode
}

/**
 * 判断当前是否为深色模式
 * @returns 是否为深色模式
 */
export function isDarkMode(): boolean {
  return getThemeMode() === 'dark'
}
