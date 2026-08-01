# 类型定义目录

## 📁 目录说明

存放 TypeScript 全局类型接口和枚举定义。

## 📂 目录结构

```
types/
├── index.ts             # 全局通用类型（已创建）
├── api.ts               # API 相关类型
├── components.ts        # 组件 Props 类型
├── enum.ts              # 枚举定义
└── ...
```

## 🔧 使用方式

```typescript
import type { ApiResponse, PageParams, UserInfo } from '@/types'
```

## ✅ 定义规范

1. **Interface vs Type**：对象用 interface，联合类型用 type
2. **命名规则**：类型名称使用 PascalCase
3. **导出方式**：使用 export type 支持按需导入
4. **避免重复**：相似类型使用泛型或继承复用
5. **注释完整**：每个属性必须有注释说明
