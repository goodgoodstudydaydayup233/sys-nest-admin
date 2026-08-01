import type { RouteRecordRaw } from 'vue-router'

/**
 * 错误页面路由模块
 * @description 所有错误页面路由均标记 hidden: true，不在侧边栏显示
 * canTo: true 允许即使 hidden 也能通过路由跳转访问
 */
const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/404',
    name: 'ErrorLayout404',
    component: () => import('@/layouts/BlankLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'NotFound',
        component: () => import('@/views/error/404.vue'),
        hidden: true,
        meta: { title: '404 - 页面未找到', canTo: true },
      },
    ],
  },
  {
    path: '/403',
    name: 'ErrorLayout403',
    component: () => import('@/layouts/BlankLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'Forbidden',
        component: () => import('@/views/error/403.vue'),
        hidden: true,
        meta: { title: '403 - 无权访问', canTo: true },
      },
    ],
  },
  {
    path: '/500',
    name: 'ErrorLayout500',
    component: () => import('@/layouts/BlankLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'ServerError',
        component: () => import('@/views/error/500.vue'),
        hidden: true,
        meta: { title: '500 - 服务器错误', canTo: true },
      },
    ],
  },
  {
    path: '/network-error',
    name: 'ErrorLayoutNetwork',
    component: () => import('@/layouts/BlankLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'NetworkError',
        component: () => import('@/views/error/NetworkError.vue'),
        hidden: true,
        meta: { title: '网络连接失败', canTo: true },
      },
    ],
  },
  {
    path: '/maintenance',
    name: 'ErrorLayoutMaintenance',
    component: () => import('@/layouts/BlankLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'Maintenance',
        component: () => import('@/views/error/Maintenance.vue'),
        hidden: true,
        meta: { title: '系统维护中', canTo: true },
      },
    ],
  },
]

/**
 * 通配 404 兜底路由
 * @description 必须在所有动态路由加载完毕后最后追加，
 * 否则会在动态路由注入前拦截所有未匹配路径导致刷新后跳转 404
 */
export const catchAllRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
}

export default errorRoutes
