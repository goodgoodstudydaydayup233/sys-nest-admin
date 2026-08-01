# API 接口层

## 📁 目录说明

存放所有与后端交互的 API 接口请求函数，按业务模块划分。

## 📂 目录结构

```
api/
├── modules/          # 按业务模块划分
│   ├── user.ts      # 用户相关接口
│   ├── role.ts      # 角色相关接口
│   ├── menu.ts      # 菜单相关接口
│   └── ...
├── index.ts         # 统一导出所有接口
└── request.ts       # Axios 实例配置（已移至 utils/request）
```

## 🔧 使用示例

```typescript
// api/modules/user.ts
import request from '@/utils/request'

/** 获取用户列表 */
export function getUserList(params: PageParams) {
  return request.get<PageResult<UserInfo>>('/user/list', { params })
}

/** 获取用户详情 */
export function getUserDetail(id: string | number) {
  return request.get<UserInfo>(`/user/${id}`)
}
```

## ✅ 编码规范

1. **命名规则**：使用 camelCase，如 `getUserList`
2. **类型定义**：必须使用 TypeScript 泛型指定返回类型
3. **参数传递**：GET 请求用 `params`，POST 请求用 `data`
4. **错误处理**：统一由拦截器处理，无需单独 try-catch
5. **注释要求**：每个接口必须有 JSDoc 注释说明用途
