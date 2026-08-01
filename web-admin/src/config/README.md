# 配置文件目录

## 📁 目录说明

存放应用的全局配置项和环境变量封装。

## 📂 目录结构

```
config/
├── index.ts             # 应用全局配置（已创建）
├── network.ts           # 网络请求配置
└── theme.ts             # 主题配置
```

## 🔧 使用方式

```typescript
import config from '@/config'

console.log(config.appTitle)
console.log(config.apiBaseUrl)
```

## ⚠️ 注意事项

- 敏感信息不要提交到 Git（使用 .env 文件）
- 配置项变更需要同步更新环境变量文档
- 生产环境和开发环境配置要分离
