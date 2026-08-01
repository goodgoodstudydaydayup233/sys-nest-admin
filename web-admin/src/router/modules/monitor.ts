import type { RouteRecordRaw } from 'vue-router'

/**
 * 系统监控静态路由模块
 * @description 存放不显示在侧边栏菜单中、通过页面按钮跳转访问的监控子页面。
 *
 * 使用独立前缀避免与动态路由 /monitor 目录冲突。
 * 当前包含：
 * - /monitor/job-log  调度日志页面（由定时任务页"日志"按钮跳转访问，不在菜单中展示）
 */
const monitorRoutes: RouteRecordRaw[] = [
  {
    path: '/monitor/job-log',
    name: 'MonitorJobLogLayout',
    component: () => import('@/layouts/DefaultLayout/index.vue'),
    hidden: true,
    children: [
      {
        path: '',
        name: 'MonitorJobLog',
        component: () => import('@/views/monitor/job/log.vue'),
        meta: { title: '调度日志', canTo: true },
        hidden: true,
      },
    ],
  },
]

export default monitorRoutes
