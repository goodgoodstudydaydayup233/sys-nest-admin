# 自定义指令目录

## 📁 目录说明

存放 Vue 自定义指令，用于 DOM 操作的复用逻辑。

## 📂 目录结构

```
directives/
├── permission.ts     # 权限指令（v-permission）
├── loading.ts       # 加载指令（v-loading 扩展）
├── copy.ts          # 复制指令（v-copy）
├── debounce.ts      # 防抖指令（v-debounce）
├── throttle.ts      # 节流指令（v-throttle）
└── index.ts         # 统一注册导出
```

## 🔧 使用示例

```vue
<template>
  <!-- 权限控制按钮显示 -->
  <el-button v-permission="['user:add']">新增用户</el-button>
  
  <!-- 复制文本 -->
  <span v-copy="'要复制的内容'">点击复制</span>
  
  <!-- 点击防抖 -->
  <el-button v-debounce="handleClick">防抖按钮</el-button>
</template>
```

## ✅ 开发规范

1. **命名规则**：指令名称使用 camelCase
2. **生命周期**：合理使用 mounted、updated 等钩子
3. **内存泄漏**：在 unmounted 中清理事件监听和定时器
4. **参数校验**：对 binding.value 进行类型检查
5. **错误处理**：添加容错机制避免指令报错影响页面
