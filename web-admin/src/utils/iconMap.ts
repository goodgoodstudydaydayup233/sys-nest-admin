/**
 * 图标映射工具
 * @description 集中管理 Element Plus 图标组件的映射关系
 * 用于路由 meta.icon 字符串 → 图标组件 的动态解析
 *
 * 全量导入 @element-plus/icons-vue，无需手动逐个注册图标
 * 后端菜单返回任意合法的 Element Plus 图标名均可直接使用
 */
import type { Component } from 'vue'
import * as Icons from '@element-plus/icons-vue'

/**
 * 图标名称 → 图标组件映射表（全量注册）
 * @description 包含 @element-plus/icons-vue 所有导出图标，
 * 后端菜单 meta.icon 字段直接使用图标名即可，无需手动补充
 */
export const iconMap: Record<string, Component> = Object.entries(Icons).reduce(
  (map, [name, component]) => {
    if (typeof component !== 'string' && typeof component !== 'function') {
      map[name] = component as Component
    }
    return map
  },
  {} as Record<string, Component>,
)

/**
 * 根据图标名称解析图标组件
 * @param name 图标名称字符串，对应路由 meta.icon 的值
 * @returns 图标组件实例，未找到时返回 undefined
 *
 * @example
 * ```typescript
 * resolveIcon('HomeFilled')   // → HomeFilled 组件
 * resolveIcon('BellFilled')   // → BellFilled 组件
 * resolveIcon('NotExist')     // → undefined
 * ```
 */
export function resolveIcon(name?: string): Component | undefined {
  return name ? iconMap[name] : undefined
}
