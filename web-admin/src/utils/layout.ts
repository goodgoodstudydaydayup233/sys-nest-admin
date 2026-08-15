/**
 * 布局模式管理工具函数
 * @description 提供整体布局模式（LayoutMode）的读取、切换与持久化。
 *
 * 支持三种整体布局：
 * - sidebar：侧边栏布局（经典后台，默认）——左侧固定侧边栏 + 右侧内容区
 * - top：顶部导航布局——菜单横向展示在顶部，无左侧边栏
 * - mix：混合布局——顶部一级菜单 + 左侧二级菜单联动
 *
 * @使用示例
 * ```ts
 * import { getLayoutMode, setLayoutMode, type LayoutMode } from '@/utils/layout'
 *
 * const mode = getLayoutMode()              // 读取持久化的布局模式
 * setLayoutMode('top')                      // 切换并持久化
 * ```
 */

export type LayoutMode = 'sidebar' | 'top' | 'mix'

/** 本地存储键名 */
const LAYOUT_STORAGE_KEY = 'app-layout-mode'

/** 合法布局模式列表（用于存储值校验） */
const VALID_MODES: LayoutMode[] = ['sidebar', 'top', 'mix']

/** 布局模式展示名称 */
export const LAYOUT_MODE_LABELS: Record<LayoutMode, string> = {
  sidebar: '侧边栏',
  top: '顶部导航',
  mix: '混合',
}

/** 布局模式说明文案 */
export const LAYOUT_MODE_DESCRIPTIONS: Record<LayoutMode, string> = {
  sidebar: '经典后台布局：左侧固定侧边栏，菜单纵向展示',
  top: '菜单横向展示在顶部导航栏，内容区更开阔',
  mix: '一级菜单在顶部，二级菜单在左侧，两级联动',
}

/**
 * 获取当前布局模式
 * @description 优先读取本地存储；存储值非法或不存在时回退到默认 'sidebar'
 * @returns 当前布局模式
 */
export function getLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'sidebar'

  const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
  if (stored && (VALID_MODES as string[]).includes(stored)) {
    return stored as LayoutMode
  }

  return 'sidebar'
}

/**
 * 设置布局模式
 * @param mode 目标布局模式
 * @param persist 是否持久化到本地存储（默认 true）
 */
export function setLayoutMode(mode: LayoutMode, persist: boolean = true): void {
  if (persist && typeof window !== 'undefined') {
    localStorage.setItem(LAYOUT_STORAGE_KEY, mode)
  }
}
