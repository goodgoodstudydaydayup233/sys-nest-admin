import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { getThemeMode, setThemeMode, type ThemeMode } from '@/utils/theme'

export const useAppStore = defineStore('app', () => {
  // 侧边栏是否折叠
  const sidebarCollapsed = ref(false)

  // 缓存的视图列表（用于 keep-alive）
  const cachedViews = ref<string[]>([])

  // 已访问的视图标签列表（用于 TagsView）
  const visitedViews = ref<RouteLocationNormalized[]>([])

  // ==================== 主题相关状态 ====================

  /** 当前主题模式 */
  const themeMode = ref<ThemeMode>(getThemeMode())

  /** 是否为深色模式（计算属性，便于模板中使用）*/
  const isDark = computed(() => themeMode.value === 'dark')

  /** 是否为浅色模式 */
  const isLight = computed(() => themeMode.value === 'light')

  // 切换侧边栏折叠状态
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // ==================== 主题相关方法 ====================

  /**
   * 设置指定主题模式
   * @param mode 目标主题模式（'light' | 'dark'）
   */
  function setThemeModeAction(mode: ThemeMode) {
    setThemeMode(mode)
    themeMode.value = mode
  }

  // ==================== TagsView / 缓存视图管理 ====================

  /**
   * 添加已访问视图
   * @description 根据路由 meta.title 去重，affix 标签固定在最前
   * @param view 当前路由对象
   */
  function addView(view: RouteLocationNormalized) {
    addVisitedView(view)
    addCachedView(view)
  }

  /**
   * 添加标签
   * @param view 当前路由对象
   */
  function addVisitedView(view: RouteLocationNormalized) {
    if (visitedViews.value.some((v) => v.path === view.path)) return

    if (view.meta?.title) {
      visitedViews.value.push({
        ...view,
        title: view.meta.title as string,
      } as RouteLocationNormalized)
    }
  }

  /**
   * 添加缓存视图
   * @param view 当前路由对象
   */
  function addCachedView(view: RouteLocationNormalized) {
    const name = view.name as string | undefined
    if (!name) return
    if (cachedViews.value.includes(name)) return
    if (view.meta?.noCache) return

    cachedViews.value.push(name)
  }

  /**
   * 删除指定标签
   * @param view 要删除的路由对象
   */
  function delView(view: RouteLocationNormalized) {
    delVisitedView(view)
    delCachedView(view)
  }

  /**
   * 删除标签
   * @param view 要删除的路由对象
   */
  function delVisitedView(view: RouteLocationNormalized) {
    for (const [i, v] of visitedViews.value.entries()) {
      if (v.path === view.path) {
        visitedViews.value.splice(i, 1)
        break
      }
    }
  }

  /**
   * 删除缓存视图
   * @param view 要删除的路由对象
   */
  function delCachedView(view: RouteLocationNormalized) {
    const name = view.name as string | undefined
    if (!name) return

    const index = cachedViews.value.indexOf(name)
    if (index > -1) {
      cachedViews.value.splice(index, 1)
    }
  }

  /**
   * 关闭其他标签
   * @param view 保留的标签
   */
  function delOthersViews(view: RouteLocationNormalized) {
    visitedViews.value = visitedViews.value.filter((v) => {
      return v.meta?.affix || v.path === view.path
    })

    const name = view.name as string | undefined
    if (name && !view.meta?.noCache) {
      cachedViews.value = [name]
    } else {
      cachedViews.value = []
    }
  }

  /**
   * 关闭所有标签
   * @param view 当前路由对象（用于保留 fixed 标签后重定向）
   */
  function delAllViews(view: RouteLocationNormalized) {
    const affixTags = visitedViews.value.filter((v) => v.meta?.affix)
    visitedViews.value = affixTags
    cachedViews.value = []

    return affixTags.some((tag) => tag.path === view.path)
  }

  /**
   * 更新标签标题（例如编辑后动态修改 title）
   * @param view 当前路由对象
   */
  function updateVisitedView(view: RouteLocationNormalized) {
    for (const v of visitedViews.value) {
      if (v.path === view.path) {
        Object.assign(v, view)
        break
      }
    }
  }

  return {
    sidebarCollapsed,
    cachedViews,
    visitedViews,

    // 主题相关
    themeMode,
    isDark,
    isLight,

    // 侧边栏方法
    toggleSidebar,

    // 主题方法
    setThemeModeAction,

    // TagsView 方法
    addView,
    addVisitedView,
    addCachedView,
    delView,
    delVisitedView,
    delCachedView,
    delOthersViews,
    delAllViews,
    updateVisitedView,
  }
})
