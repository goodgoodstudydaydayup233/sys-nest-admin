# 常量定义目录

## 📁 目录说明

存放项目中使用的常量定义，避免魔法值。

## 📂 目录结构

```
constants/
├── index.ts             # 全局常量（已创建）
├── api.ts               # API 相关常量
├── regexp.ts            # 正则表达式
└── ...
```

## 🔧 使用方式

```typescript
import { TOKEN_KEY, HttpStatus, DEFAULT_PAGE_SIZE } from '@/constants'
```

## ✅ 定义规范

1. **命名规则**：常量使用 UPPER_SNAKE_CASE
2. **分组管理**：按功能模块分类到不同文件
3. **枚举优先**：相关常量考虑使用枚举替代
4. **避免散落**：不要在组件中直接定义常量
5. **注释说明**：每个常量必须有注释说明用途
