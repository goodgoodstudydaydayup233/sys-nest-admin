# 公共组件目录

## 📁 目录说明

存放项目中可复用的公共组件，分为全局通用组件和业务通用组件。

## 📂 目录结构

```
components/
├── Global/            # 全局通用组件（自动注册）
│   ├── Table/         # 表格封装组件
│   ├── Search/        # 搜索栏组件
│   ├── Form/          # 表单组件
│   ├── Dialog/        # 弹窗组件
│   ├── Upload/        # 上传组件
│   ├── Pagination/    # 分页组件
│   └── ...
└── Business/          # 业务通用组件
    ├── UserSelect/    # 用户选择器
    ├── TreeSelect/    # 树形选择器
    └── ...
```

## 🔧 使用示例

### Global 组件（自动注册）

```vue
<!-- 无需导入，直接使用 -->
<template>
  <Table :columns="columns" :data="tableData" />
</template>
```

### Business 组件（手动导入）

```vue
<script setup>
import UserSelect from '@/components/Business/UserSelect/index.vue'
</script>

<template>
  <UserSelect v-model="userId" />
</template>
```

## ✅ 组件开发规范

1. **命名规则**：使用 PascalCase 命名文件夹和组件
2. **Props 定义**：必须定义类型和默认值
3. **Emits 声明**：必须显式声明触发的事件
4. **插槽支持**：预留自定义插槽提高扩展性
5. **文档注释**：组件必须有完整的 JSDoc 注释
6. **单一职责**：每个组件只做一件事
