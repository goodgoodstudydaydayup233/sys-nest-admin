# 路由配置目录

## 📁 目录说明

存放 Vue Router 路由配置，支持模块化管理和动态路由。

## 📂 目录结构

```
router/
├── modules/              # 路由模块（按业务划分）
│   ├── dashboard.ts     # 首页路由
│   ├── system.ts        # 系统管理路由
│   └── ...
├── index.ts             # 路由实例创建
└── guards.ts            # 路由守卫（权限验证）
```

## 🔧 配置示例

```typescript
// router/modules/system.ts
import type { RouteRecordRaw } from 'vue-router'

const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    component: () => import('@/layouts/DefaultLayout/index.vue'),
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        component: () => import('@/views/system/user/index.vue'),
        name: 'UserManage',
        meta: { title: '用户管理', icon: 'User' },
      },
    ],
  },
]

export default systemRoutes
```

## ✅ 路由规范

1. **命名规则**：路由 name 使用 PascalCase
2. **懒加载**：所有页面组件必须使用动态导入
3. **元信息**：meta 中必须包含 title
4. **权限控制**：通过 roles/permissions 字段控制访问权限
5. **嵌套路由**：使用 layouts 作为父级布局组件
6. **动态菜单**：支持从后端获取菜单配置生成路由
