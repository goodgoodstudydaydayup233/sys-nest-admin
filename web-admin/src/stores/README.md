# 状态管理目录

## 📁 目录说明

存放 Pinia Store 状态管理，按业务模块划分。

## 📂 目录结构

```
stores/
├── modules/              # Store 模块
│   ├── user.ts          # 用户状态（token、用户信息）
│   ├── app.ts           # 应用状态（主题、布局、侧边栏）
│   ├── permission.ts    # 权限状态（菜单、按钮权限）
│   └── tagsView.ts      # 标签页状态
└── index.ts             # Store 统一注册导出
```

## 🔧 使用示例

```typescript
// stores/modules/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  
  const isLoggedIn = computed(() => !!token.value)
  
  async function login(loginForm: LoginParams) {
    // 登录逻辑
  }
  
  function logout() {
    // 登出逻辑
  }
  
  return { token, userInfo, isLoggedIn, login, logout }
})
```

## ✅ 开发规范

1. **命名规则**：Store 名称使用 camelCase，以 `use` 开头
2. **Setup 语法**：优先使用 Composition API 风格（函数式）
3. **类型安全**：所有状态必须定义 TypeScript 类型
4. **持久化**：使用插件实现关键数据持久化（如 token、用户信息）
5. **单一职责**：每个 Store 只管理一个业务域的状态
6. **Getters**：使用 computed 派生状态，避免在组件中重复计算
