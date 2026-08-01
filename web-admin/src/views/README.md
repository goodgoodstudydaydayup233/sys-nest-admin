# 页面视图目录

## 📁 目录说明

存放项目的页面组件，对应路由中的视图。

## 📂 目录结构

```
views/
├── dashboard/           # 首页仪表盘
│   ├── index.vue
│   └── components/      # 仪表盘子组件 
├── login/               # 登录页
│   └── index.vue
├── error/               # 错误页面
│   ├── 404.vue
│   └── 403.vue
├── system/              # 系统管理（示例）
│   ├── user/            # 用户管理
│   │   ├── index.vue
│   │   └── components/
│   ├── role/            # 角色管理
│   └── menu/            # 菜单管理
└── ...                  # 其他业务模块
```

## 🔧 组件结构模板

```vue
<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <SearchBar v-model="queryParams" @search="handleSearch" @reset="handleReset" />

    <!-- 操作按钮 -->
    <div class="table-operations">
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </div>

    <!-- 表格 -->
    <Table :columns="columns" :data="tableData" :loading="loading" />

    <!-- 分页 -->
    <Pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      @change="fetchData"
    />

    <!-- 弹窗 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" @confirm="handleSubmit">
      <Form ref="formRef" :model="formData" :rules="formRules" />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 页面标题 - 简要描述页面功能
 */
import { ref, onMounted } from 'vue'
import { SearchBar, Table, Pagination, Dialog, Form } from '@/components'
import { useTable, useDialog } from '@/hooks'
import { getListApi, createApi, updateApi, deleteApi } from '@/api'

// 表格列定义
const columns = [...]

// Hook 使用
const { loading, data, pagination, fetchData } = useTable({ getListApi })
const { visible: dialogVisible, openDialog, closeDialog } = useDialog()

// 事件处理
function handleSearch() { fetchData() }
function handleReset() { /* 重置逻辑 */ }
function handleAdd() { openDialog() }

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}
</style>
```

## ✅ 开发规范

1. **命名规则**：文件夹和文件名使用 kebab-case
2. **组件拆分**：复杂页面拆分子组件到 components 文件夹
3. **Hook 使用**：优先使用封装好的 Hooks 减少重复代码
4. **样式隔离**：必须使用 scoped 避免样式污染
5. **代码顺序**：template → script → style
6. **注释要求**：文件顶部必须有功能说明注释
