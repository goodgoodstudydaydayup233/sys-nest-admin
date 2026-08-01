import type { RouteRecordRaw } from 'vue-router'

/**
 * 系统管理静态路由模块
 * @description 不需要动态权限加载的系统级页面（如个人中心）
 * 使用独立前缀 /account 避免与动态路由 /system 冲突
 */
const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/layouts/DefaultLayout/index.vue'),
    redirect: '/account/personal',
    hidden: true,
    children: [
      {
        path: 'personal',
        name: 'Personal',
        component: () => import('@/views/system/user/personal.vue'),
        meta: { title: '个人中心', canTo: true },
        hidden: true,
      },
    ],
  },
]

export default systemRoutes
