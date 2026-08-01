# 工具函数目录

## 📁 目录说明

存放项目中的工具函数和第三方库封装。

## 📂 目录结构

```
utils/
├── request/             # HTTP 请求封装
│   ├── index.ts        # Axios 实例配置
│   ├── interceptors.ts # 请求/响应拦截器
│   ├── helper.ts       # 请求辅助方法
│   └── types.ts        # 请求相关类型
├── auth/                # 认证工具
│   ├── index.ts        # Token 管理
│   └── permission.ts   # 权限判断
├── storage.ts          # 本地存储封装
├── validate.ts         # 表单验证规则
├── format.ts           # 格式化工具（日期、金额等）
├── download.ts         # 文件下载工具
├── dict.ts             # 字典数据处理
└── index.ts            # 统一导出
```

## 🔧 核心功能

### HTTP 请求（request/index.ts）

```typescript
// 基础用法
import request from '@/utils/request'

// GET 请求
const data = await request.get('/dev-api/list', { params })

// POST 请求
const result = await request.post('/admin/create', data)

// 文件上传
const formData = new FormData()
formData.append('file', file)
await request.upload('/dev-api/upload', formData)
```

### Token 管理（auth/index.ts）

```typescript
import { getToken, setToken, removeToken } from '@/utils/auth'

// 设置 Token
setToken('your-token')

// 获取 Token
const token = getToken()

// 移除 Token
removeToken()
```

### 本地存储（storage.ts）

```typescript
import Storage from '@/utils/storage'

// 设置存储（支持过期时间）
Storage.set('key', value, 24 * 60 * 60 * 1000)

// 获取存储
const data = Storage.get('key')

// 移除存储
Storage.remove('key')

// 清空所有存储
Storage.clear()
```

## ✅ 开发规范

1. **错误处理**：统一处理异常，返回友好提示
2. **类型定义**：所有函数必须定义参数和返回值类型
3. **注释完整**：每个函数必须有 JSDoc 注释说明用途和参数
4. **纯函数**：尽量编写无副作用的纯函数
5. **可测试**：方便单元测试
6. **按需导入**：避免在入口文件一次性导入全部工具
