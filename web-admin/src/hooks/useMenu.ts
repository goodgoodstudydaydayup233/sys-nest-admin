/**
 * useMenu - 菜单数据 Hook
 * @description 从 Vue Router 路由配置中自动提取侧边栏菜单数据
 * 遵循若依/芋道开源项目规范：
 *   - 单子路由：父级 meta 置空，菜单中不显示目录，直接显示子路由
 *   - 多子路由：父级 meta 携带目录 title/icon，菜单显示为可展开目录
 *   - alwaysShow: true 强制显示目录（即使只有一个子路由）
 *   - hidden: true 不在侧边栏显示
 *   - canTo: true 即使 hidden 也允许路由跳转
 *
 * 二次开发扩展：新增路由模块后自动出现在菜单中，无需手动维护菜单数组
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useMenu } from '@/hooks/useMenu'
 *
 * const { menuRoutes } = useMenu()
 * </script>
 *
 * <template>
 *   <sidebar-item v-for="route in menuRoutes" :key="route.path" :item="route" />
 * </template>
 * ```
 */
import { computed } from 'vue'
import { useRouter, type RouteRecordRaw, type RouteMeta } from 'vue-router'
import { usePermissionStore } from '@/stores/modules/permission'

/** 菜单项（从路由配置中提取的精简结构）*/
export interface MenuRoute {
  path: string
  meta: RouteMeta
  /** 路由是否在侧边栏隐藏（与 path 同级） */
  hidden?: boolean
  children?: MenuRoute[]
}

/** 需要过滤的路径前缀（不显示在侧边栏）*/
const EXCLUDED_PATHS = [
  '/login',
  '/404',
  '/403',
  '/500',
  '/network-error',
  '/maintenance',
  '/redirect',
]

/**
 * 判断路由是否为可见菜单项
 * @description 过滤条件：在排除列表中、顶级 hidden 为 true
 * 注意：父级路由可能没有 title（单子路由模式），不应仅凭 title 过滤
 */
function isVisibleRoute(route: RouteRecordRaw): boolean {
  const path = route.path
  if (EXCLUDED_PATHS.some((excluded) => path === excluded || path.startsWith(excluded + '/'))) {
    return false
  }
  if (route.hidden) {
    return false
  }
  return true
}

/**
 * 解析子路由完整路径
 * @description 将相对路径拼接为绝对路径
 */
function resolvePath(parentPath: string, childPath: string): string {
  if (childPath.startsWith('/')) {
    return childPath
  }
  if (childPath.startsWith('http://') || childPath.startsWith('https://')) {
    return childPath
  }
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/')
}

/**
 * 递归提取菜单树
 * @description 核心逻辑：
 *   1. 过滤隐藏路由
 *   2. 若父级 alwaysShow 为 true → 始终显示目录
 *   3. 若只有一个可见子路由 → 提升子路由为顶级菜单项（不显示目录）
 *   4. 若有多个可见子路由 → 显示为可展开目录
 */
function extractMenuRoutes(routes: readonly RouteRecordRaw[]): MenuRoute[] {
  const menus: MenuRoute[] = []

  for (const route of routes) {
    if (!isVisibleRoute(route)) continue

    const children = route.children ?? []
    const visibleChildren = children.filter((child) => isVisibleRoute(child))

    if (visibleChildren.length === 0) continue

    const alwaysShow = route.alwaysShow

    if (visibleChildren.length === 1 && !alwaysShow) {
      const onlyChild = visibleChildren[0]!
      const childPath = resolvePath(route.path, onlyChild.path)

      const grandChildren = onlyChild.children?.filter((gc) => isVisibleRoute(gc)) ?? []

      if (grandChildren.length > 0) {
        menus.push({
          path: childPath,
          meta: onlyChild.meta ?? route.meta ?? {},
          hidden: onlyChild.hidden,
          children: buildChildMenus(childPath, grandChildren),
        })
      } else {
        menus.push({
          path: childPath,
          meta: onlyChild.meta ?? route.meta ?? {},
          hidden: onlyChild.hidden,
        })
      }
    } else {
      menus.push({
        path: route.path,
        meta: route.meta ?? {},
        hidden: route.hidden,
        children: buildChildMenus(route.path, visibleChildren),
      })
    }
  }

  return menus
}

/**
 * 递归构建子菜单
 * @description 处理多级嵌套的子路由，递归应用 alwaysShow 和单子路由提升逻辑
 */
function buildChildMenus(parentPath: string, children: readonly RouteRecordRaw[]): MenuRoute[] {
  const result: MenuRoute[] = []

  for (const child of children) {
    if (!isVisibleRoute(child)) continue

    const fullPath = resolvePath(parentPath, child.path)
    const grandChildren = child.children?.filter((gc) => isVisibleRoute(gc)) ?? []
    const alwaysShow = child.alwaysShow

    if (grandChildren.length === 1 && !alwaysShow) {
      const onlyGrandChild = grandChildren[0]!
      const grandChildPath = resolvePath(fullPath, onlyGrandChild.path)

      const deeperChildren = onlyGrandChild.children?.filter((dc) => isVisibleRoute(dc)) ?? []

      if (deeperChildren.length > 0) {
        result.push({
          path: grandChildPath,
          meta: onlyGrandChild.meta ?? child.meta ?? {},
          hidden: onlyGrandChild.hidden,
          children: buildChildMenus(grandChildPath, deeperChildren),
        })
      } else {
        result.push({
          path: grandChildPath,
          meta: onlyGrandChild.meta ?? child.meta ?? {},
          hidden: onlyGrandChild.hidden,
        })
      }
    } else if (grandChildren.length > 1 || alwaysShow) {
      result.push({
        path: fullPath,
        meta: child.meta ?? {},
        hidden: child.hidden,
        children: buildChildMenus(fullPath, grandChildren),
      })
    } else if (grandChildren.length === 0) {
      result.push({
        path: fullPath,
        meta: child.meta ?? {},
        hidden: child.hidden,
      })
    } else {
      result.push({
        path: fullPath,
        meta: child.meta ?? {},
        hidden: child.hidden,
        children: buildChildMenus(fullPath, grandChildren),
      })
    }
  }

  return result
}

/**
 * 菜单数据 Hook
 * @description 优先从 Permission Store 获取侧边栏路由（包含动态路由），
 * 若动态路由未加载则回退到 router.options.routes（静态路由）
 * @returns menuRoutes - 响应式菜单路由列表
 */
export function useMenu() {
  const router = useRouter()
  const permissionStore = usePermissionStore()

  const menuRoutes = computed<MenuRoute[]>(() => {
    const allRoutes = permissionStore.isRoutesLoaded
      ? permissionStore.sidebarRoutes
      : router.options.routes
    return extractMenuRoutes(allRoutes)
  })

  return { menuRoutes }
}
