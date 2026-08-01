/**
 * 路由守卫 - 权限验证与动态路由加载
 * @description
 * 全局前置守卫，处理以下逻辑：
 * 1. 未登录 → 跳转登录页（白名单放行）
 * 2. 已登录但路由未加载 → 获取用户信息 + 动态路由
 * 3. 已登录且路由已加载 → 正常跳转
 * 4. 已登录访问登录页 → 重定向首页
 *
 * 全局后置守卫：
 * - 结束进度条
 * - 更新 TagsView 与 keep-alive 缓存
 */
import type { Router } from 'vue-router'
import { WHITE_LIST, DEFAULT_HOME_PATH, LOGIN_PATH } from './whiteList'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useAppStore } from '@/stores/modules/app'
import { startProgress, doneProgress } from '@/utils/nprogress'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    startProgress()

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    const token = userStore.token

    if (token) {
      if (to.path === LOGIN_PATH) {
        next({ path: DEFAULT_HOME_PATH })
      } else {
        if (permissionStore.isRoutesLoaded) {
          next()
        } else {
          try {
            if (!userStore.userInfo) {
              await userStore.getUserInfo()
            }

            await permissionStore.generateRoutes()

            next({ ...to, replace: true })
          } catch {
            userStore.resetState()
            next(`${LOGIN_PATH}?redirect=${to.path}`)
          }
        }
      }
    } else {
      if (WHITE_LIST.includes(to.path)) {
        next()
      } else {
        next(`${LOGIN_PATH}?redirect=${to.path}`)
      }
    }
  })

  router.afterEach((to) => {
    doneProgress()

    // 更新 TagsView 和 keep-alive 缓存
    const appStore = useAppStore()
    if (to.name && to.meta?.title) {
      appStore.addView(to)
    }
  })
}
