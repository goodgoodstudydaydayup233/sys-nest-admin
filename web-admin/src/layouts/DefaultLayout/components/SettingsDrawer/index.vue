<template>
  <el-drawer v-model="drawerVisible" title="系统设置" size="340px" append-to-body>
    <!-- 整体布局设置 -->
    <div class="settings-section">
      <div class="section-title">整体布局</div>
      <p class="section-desc">选择你喜欢的整体布局方式，修改后立即生效并自动保存</p>
      <div class="layout-mode-list">
        <div
          v-for="mode in layoutModeOptions"
          :key="mode.value"
          class="layout-mode-item"
          :class="{ 'is-active': appStore.layoutMode === mode.value }"
          @click="handleChangeMode(mode.value)"
        >
          <div class="layout-icon" :class="`layout-icon--${mode.value}`">
            <span class="icon-nav"></span>
            <span class="icon-sidebar"></span>
            <span class="icon-content"></span>
          </div>
          <div class="mode-name">{{ mode.label }}</div>
          <div class="mode-desc">{{ mode.description }}</div>
          <el-icon v-if="appStore.layoutMode === mode.value" class="mode-check"
            ><CircleCheckFilled
          /></el-icon>
        </div>
      </div>
    </div>

    <!-- 其他设置（预留） -->
    <div class="settings-section">
      <div class="section-title">其他</div>
      <div class="other-item">
        <span>主题模式</span>
        <el-button size="small" @click="toggle">
          {{ isDark ? '切换到亮色' : '切换到暗色' }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * SettingsDrawer - 系统设置抽屉
 * @description 点击右上角「系统设置」弹出，提供整体布局模式的修改：
 * - sidebar（侧边栏）：经典后台布局，左侧固定侧边栏，默认
 * - top（顶部导航）：菜单横向展示在顶部，内容区更开阔
 * - mix（混合）：一级菜单在顶部、二级菜单在左侧，两级联动
 *
 * 布局模式持久化到 localStorage（app-layout-mode），刷新后保持。
 */
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/modules/app'
import { useTheme } from '@/hooks/useTheme'
import { LAYOUT_MODE_DESCRIPTIONS, LAYOUT_MODE_LABELS, type LayoutMode } from '@/utils/layout'

const appStore = useAppStore()
const { isDark, toggle } = useTheme()

/** 抽屉显隐（绑定 store） */
const drawerVisible = computed({
  get: () => appStore.settingsVisible,
  set: (val: boolean) => (val ? appStore.openSettings() : appStore.closeSettings()),
})

/** 布局模式选项 */
const layoutModeOptions: { value: LayoutMode; label: string; description: string }[] = (
  ['sidebar', 'top', 'mix'] as LayoutMode[]
).map((mode) => ({
  value: mode,
  label: LAYOUT_MODE_LABELS[mode],
  description: LAYOUT_MODE_DESCRIPTIONS[mode],
}))

/** 切换布局模式 */
function handleChangeMode(mode: LayoutMode) {
  if (appStore.layoutMode === mode) return
  appStore.setLayoutModeAction(mode)
  ElMessage.success(`已切换为「${LAYOUT_MODE_LABELS[mode]}」布局`)
}
</script>

<style scoped lang="scss">
.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.section-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
}

.layout-mode-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layout-mode-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* 布局示意图：三种结构的 CSS 简绘 */
.layout-icon {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 52px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
  overflow: hidden;

  .icon-nav {
    position: absolute;
    top: 0;
    left: 0;
    height: 12px;
    background: var(--el-color-primary);
    opacity: 0.85;
  }

  .icon-sidebar {
    position: absolute;
    top: 12px;
    left: 0;
    bottom: 0;
    width: 16px;
    background: var(--el-color-primary-light-5);
  }

  .icon-content {
    position: absolute;
    top: 12px;
    right: 0;
    bottom: 0;
    background: var(--el-fill-color);
  }
}

/* 侧边栏布局：左侧边栏 + 顶部导航 + 内容 */
.layout-icon--sidebar {
  .icon-nav {
    left: 16px;
    right: 0;
  }

  .icon-content {
    left: 16px;
  }
}

/* 顶部布局：全宽导航 + 内容 */
.layout-icon--top {
  .icon-nav {
    left: 0;
    right: 0;
  }

  .icon-sidebar {
    display: none;
  }

  .icon-content {
    left: 0;
  }
}

/* 混合布局：顶部导航 + 左侧二级菜单 + 内容 */
.layout-icon--mix {
  .icon-nav {
    left: 0;
    right: 0;
  }

  .icon-content {
    left: 16px;
  }
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.mode-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.mode-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--el-color-primary);
  font-size: 16px;
}

.other-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>
