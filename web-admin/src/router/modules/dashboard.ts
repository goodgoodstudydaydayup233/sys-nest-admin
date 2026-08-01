import type { RouteRecordRaw } from 'vue-router'

/**
 * 首页路由模块
 * @description 单子路由模式：父级 meta 置空，子级携带 title/icon
 * 菜单中不显示目录，直接显示「首页」菜单项
 */
const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'DashboardLayout',
    component: () => import('@/layouts/DefaultLayout/index.vue'),
    redirect: '/dashboard/index',
    meta: {},
    children: [
      {
        path: 'index',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled', affix: true },
      },
    ],
  },
]

export default dashboardRoutes
