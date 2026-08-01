/**
 * Permission Store - 权限与动态路由状态管理
 * @description
 * 1. 调用后端 GET /auth/getRouters 获取当前用户有权限的路由菜单
 * 2. 将后端返回的 component 字符串（'Layout'/'ParentView'/'InnerLink'/实际路径）转换为真实 Vue 组件
 * 3. 通过 router.addRoute() 将动态路由注入路由实例
 * 4. 维护侧边栏菜单数据，供 useMenu Hook 或 Sidebar 直接消费
 *
 * @example 在路由守卫中使用
 * ```typescript
 * const permissionStore = usePermissionStore()
 * const routes = await permissionStore.generateRoutes()
 * routes.forEach((route) => router.addRoute(route))
 * next({ ...to, replace: true })
 * ```
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import { constantRoutes } from '@/router'
import { catchAllRoute } from '@/router/modules/error'
import { authApi } from '@/api/system'
import type { RouterInfo } from '@/api/system'
import Layout from '@/layouts/DefaultLayout/index.vue'
import ParentView from '@/layouts/ParentView/index.vue'
import InnerLink from '@/layouts/InnerLink/index.vue'

/** 动态导入 src/views 下所有 .vue 文件 */
const viewModules = import.meta.glob('@/views/**/*.vue')

export const usePermissionStore = defineStore('permission', () => {
  // ==================== 状态定义 ====================

  /** 完整路由列表（静态 + 动态），用于菜单渲染 */
  const routes = ref<RouteRecordRaw[]>([])

  /** 侧边栏路由列表（静态 + 动态） */
  const sidebarRoutes = ref<RouteRecordRaw[]>([])

  /** 后端返回的原始路由数据（已转换组件的动态路由） */
  const addRoutes = ref<RouteRecordRaw[]>([])

  /** 是否已加载过路由 */
  const isRoutesLoaded = ref(false)

  // ==================== 核心方法 ====================

  /**
   * 生成动态路由
   * @description
   * 1. 调用后端接口获取路由菜单树
   * 2. 将 component 字符串转换为真实组件
   * 3. 通过 router.addRoute() 注入路由
   * 4. 更新侧边栏菜单数据
   *
   * @returns 转换后的动态路由列表
   */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    try {
      const data = await authApi.getRouters()

      const sdata = JSON.parse(JSON.stringify(data))
      const rdata = JSON.parse(JSON.stringify(data))

      const sidebarData = filterAsyncRouter(sdata)
      const rewriteData = filterAsyncRouter(rdata, true)

      addRoutes.value = rewriteData
      routes.value = constantRoutes.concat(rewriteData)
      sidebarRoutes.value = constantRoutes.concat(sidebarData)
      isRoutesLoaded.value = true

      rewriteData.forEach((route) => {
        router.addRoute(route)
      })

      router.addRoute(catchAllRoute)

      console.log('[Permission] 动态路由已注入:', rewriteData)
      return rewriteData
    } catch (error) {
      console.error('[Permission] 获取路由信息失败:', error)
      throw error
    }
  }

  /**
   * 重置权限状态
   * @description 登出时调用，移除动态路由并清空缓存
   */
  function resetRoutes() {
    addRoutes.value.forEach((route) => {
      if (route.name) {
        router.removeRoute(route.name)
      }
    })
    routes.value = []
    sidebarRoutes.value = []
    addRoutes.value = []
    isRoutesLoaded.value = false
  }

  return {
    routes,
    sidebarRoutes,
    addRoutes,
    isRoutesLoaded,
    generateRoutes,
    resetRoutes,
  }
})

// ==================== 内部工具函数 ====================

/**
 * 过滤并转换后端路由数据
 * @description 将后端返回的路由字符串转换为 Vue Router 可用的路由对象
 * @param asyncRouterMap 后端返回的路由数据
 * @param isRewrite 是否为重写模式（true 时处理子路由路径拼接）
 */
function filterAsyncRouter(asyncRouterMap: RouterInfo[], isRewrite = false): RouteRecordRaw[] {
  return asyncRouterMap
    .filter((route) => {
      if (isRewrite && route.children) {
        route.children = filterChildren(route.children)
      }
      return true
    })
    .map((route) => {
      const routeRecord = {
        path: route.path,
        name: route.name,
        component: resolveRouteComponent(route.component),
        query: route.query || undefined,
        redirect: route.redirect || undefined,
        hidden: route.hidden,
        alwaysShow: route.alwaysShow,
        meta: {
          title: route.meta?.title || '',
          icon: route.meta?.icon || '',
          noCache: route.meta?.noCache || false,
          link: route.meta?.link,
          path: route.meta?.path,
        },
      } as RouteRecordRaw

      if (route.children?.length) {
        routeRecord.children = filterAsyncRouter(route.children, isRewrite)
      }

      return routeRecord
    })
}

/**
 * 处理子路由（ParentView 模式下的路径拼接）
 * @description 当父级为 ParentView 且子级只有一个子路由时，将路径拼接到父级
 */
function filterChildren(children: RouterInfo[]): RouterInfo[] {
  const result: RouterInfo[] = []

  children.forEach((child) => {
    if (child.children?.length) {
      if (child.component === 'ParentView') {
        child.children.forEach((c) => {
          c.path = `${child.path}/${c.path}`
          if (c.children?.length) {
            result.push(...filterChildren([c]))
            return
          }
          result.push(c)
        })
        return
      }
    }
    result.push(child)
  })

  return result
}

/**
 * 解析组件字符串为真实 Vue 组件
 * @description
 * - '' / null / undefined → undefined（外链等无组件路由，前端以 <a> 渲染，不进入路由）
 * - 'Layout' → DefaultLayout 组件
 * - 'ParentView' → ParentView 组件
 * - 'InnerLink' → InnerLink 组件
 * - 其他字符串 → 从 views 目录动态导入
 */
function resolveRouteComponent(component: string) {
  if (!component) return undefined
  if (component === 'Layout') return Layout
  if (component === 'ParentView') return ParentView
  if (component === 'InnerLink') return InnerLink

  const viewPath = `/src/views/${component}.vue`
  if (viewModules[viewPath]) {
    return viewModules[viewPath]
  }

  console.warn(`[Permission] 未找到视图组件: ${component}`)
  return ParentView
}
