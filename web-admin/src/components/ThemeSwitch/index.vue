<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="theme-switch" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
      <!-- 太阳图标（浅色模式）-->
      <transition name="theme-icon" mode="out-in">
        <el-icon v-if="!isDark" key="sun" class="icon-sun" :size="20">
          <Sunny />
        </el-icon>
        <!-- 月亮图标（深色模式）-->
        <el-icon v-else key="moon" class="icon-moon" :size="20">
          <Moon />
        </el-icon>
      </transition>
    </div>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="light" :class="{ 'is-active': !isDark }">
          <el-icon><Sunny /></el-icon>
          <span>浅色模式</span>
        </el-dropdown-item>
        <el-dropdown-item command="dark" :class="{ 'is-active': isDark }">
          <el-icon><Moon /></el-icon>
          <span>深色模式</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
/**
 * ThemeSwitch - 主题切换组件
 * @description 提供浅色/深色两种模式的切换功能
 *
 * @example 基础用法
 * ```vue
 * <template>
 *   <ThemeSwitch />
 * </template>
 * ```
 */
import { computed } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()

/** 是否为深色模式（从 Store 获取）*/
const isDark = computed(() => appStore.isDark)

/**
 * 处理下拉菜单命令
 * @param mode 用户选择的模式
 */
function handleCommand(mode: string) {
  if (mode === 'light' || mode === 'dark') {
    appStore.setThemeModeAction(mode)
  }
}
</script>

<style lang="css" scoped>
.theme-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-base, 4px);
  cursor: pointer;
  transition: all var(--transition-duration-base, 0.3s);
  color: var(--navbar-text-color, #606266);

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--color-primary, #409eff);
  }
}

/* 图标过渡动画 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.25s ease-out;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

.icon-sun,
.icon-moon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下拉菜单样式优化 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    font-size: 16px;
  }
}

:deep(.el-dropdown-menu__item.is-active) {
  color: var(--color-primary, #409eff);
  background-color: var(--color-primary-light-9, #ecf5ff);
}
</style>
