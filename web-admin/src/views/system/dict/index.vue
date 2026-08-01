<template>
  <div class="page-container dict-page">
    <div class="dict-layout">
      <!-- 左侧：分组/类型导航树 -->
      <div class="layout-left">
        <el-card shadow="never" class="left-card">
          <DictTree @select="onTypeSelect" />
        </el-card>
      </div>
      <!-- 右侧：类型信息 + 数据列表 -->
      <div class="layout-right">
        <el-card shadow="never" class="right-card">
          <DictDataPanel
            v-if="selectedTypeId"
            :type-id="selectedTypeId"
            :type-info="selectedTypeInfo!"
          />
          <el-empty v-else description="请从左侧选择一个字典类型查看数据" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DictManage - 字典管理页面（左右布局版）
 * @description 左侧为分组折叠+类型树形导航，右侧展示选中类型的详情及数据条目管理
 *
 * @布局说明
 * ┌──────────────┬────────────────────────────────┐
 * │              │  类型信息卡片                    │
 * │  左侧导航树   ├────────────────────────────────┤
 * │  分组 → 类型  │  筛选区 → 操作栏 → 表格 → 分页   │
 * │              │  （一般标准页结构）                │
 * └──────────────┴────────────────────────────────┘
 */
import { ref } from 'vue'
import DictTree from './components/DictTree.vue'
import DictDataPanel from './components/DictDataPanel.vue'
import type { DictTypeVo } from '@/api/system'

const selectedTypeId = ref<number | string>()
const selectedTypeInfo = ref<DictTypeVo>()

function onTypeSelect(typeInfo: DictTypeVo) {
  selectedTypeId.value = Number(typeInfo.id)
  selectedTypeInfo.value = typeInfo
}
</script>

<style lang="css" scoped>
.dict-page {
  box-sizing: border-box;
  padding: 16px;
  height: calc(100vh - var(--navbar-height, 50px) - 32px);
  overflow: hidden;
}

.dict-layout {
  display: flex;
  gap: 12px;
  height: 100%;
}

.layout-left {
  width: 260px;
  flex-shrink: 0;
}

.left-card {
  height: 100%;
  border-radius: var(--el-border-radius-base);
}

.left-card :deep(.el-card__body) {
  padding: 0;
  height: calc(100% - 2px);
  overflow: hidden;
}

.layout-right {
  flex: 1;
  min-width: 0;
}

.right-card {
  height: 100%;
  border-radius: var(--el-border-radius-base);
}

.right-card :deep(.el-card__body) {
  height: calc(100% - 2px);
  overflow: hidden;
}
</style>
