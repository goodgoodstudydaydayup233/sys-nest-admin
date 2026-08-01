# 组合式函数（Hooks）目录

## 📁 目录说明

存放 Vue 3 Composition API 的可复用逻辑组合函数。

## 📂 目录结构

```
hooks/
├── useTable.ts       # 表格查询 Hook
├── useForm.ts        # 表单操作 Hook
├── useDialog.ts      # 弹窗控制 Hook
├── usePagination.ts  # 分页 Hook
├── usePermission.ts  # 权限判断 Hook
├── useTheme.ts       # 主题切换 Hook
├── useDict.ts        # 字典数据 Hook
├── useDownload.ts    # 文件下载 Hook
└── index.ts          # 统一导出
```

## 🔧 使用示例

```vue
<script setup lang="ts">
import { useTable, useDialog } from '@/hooks'

// 表格查询
const { loading, data, pagination, fetchData } = useTable({
  getListApi: getUserList,
})

// 弹窗控制
const { visible, openDialog, closeDialog } = useDialog()
</script>
```

## ✅ 开发规范

1. **命名规则**：以 `use` 开头，使用 camelCase
2. **返回值**：明确标注返回值的类型
3. **响应式**：使用 ref/reactive 管理状态
4. **生命周期**：在 onUnmounted 清理副作用
5. **参数设计**：支持配置对象参数，提供合理默认值
6. **单一职责**：每个 Hook 只关注一个业务场景
