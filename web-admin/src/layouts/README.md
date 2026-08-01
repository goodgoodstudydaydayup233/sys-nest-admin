# 布局组件目录

## 📁 目录说明

存放应用的全局布局组件，负责页面整体结构。

## 📂 目录结构

```
layouts/
├── DefaultLayout/        # 默认布局（侧边栏 + 顶栏 + 内容区）
│   ├── index.vue         # 主布局组件
│   ├── components/       # 布局子组件
│   │   ├── Sidebar/      # 侧边栏
│   │   ├── Navbar/       # 顶部导航栏
│   │   ├── AppMain/      # 内容区域
│   │   ├── TabsView/     # 标签页导航
│   │   ├── Breadcrumb/   # 面包屑
│   │   └── Settings/     # 设置面板
│   └── hooks/            # 布局相关 Hooks
├── BlankLayout/          # 空白布局（登录页等）
│   └── index.vue
├── components/           # 布局公共组件
└── index.ts              # 布局配置导出
```

## 🔧 布局特性

### DefaultLayout 功能：
- ✅ 可折叠侧边栏
- ✅ 响应式布局适配
- ✅ 标签页导航（支持关闭、刷新）
- ✅ 面包屑导航
- ✅ 全屏切换
- ✅ 暗黑模式切换
- ✅ 个人中心下拉菜单
- ✅ 消息通知入口
- ✅ 搜索功能

### BlankLayout 用途：
- 登录页
- 注册页
- 错误页面（404、403 等）

## ✅ 使用方式

路由配置中使用 layout：

```typescript
// router/modules/dashboard.ts
{
  path: '/dashboard',
  component: () => import('@/layouts/DefaultLayout/index.vue'),
  children: [
    {
      path: '',
      component: () => import('@/views/dashboard/index.vue'),
      meta: { title: '首页' }
    }
  ]
}
```
