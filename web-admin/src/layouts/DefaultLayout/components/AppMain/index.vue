<template>
  <section class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup lang="ts">
/**
 * AppMain - 内容区域组件
 * @description 路由视图容器，支持页面缓存和过渡动画
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
const cachedViews = computed(() => appStore.cachedViews)
</script>

<style lang="scss" scoped>
/**
 * AppMain 内容区域样式
 * @description 路由视图容器，支持页面缓存和过渡动画
 *
 * 关键设计：
 * - height: 100% - 填满父容器剩余空间（由 flex: 1 分配）
 * - overflow-y: auto - 仅在内容超出时显示垂直滚动条
 * - overflow-x: hidden - 禁止水平滚动条
 */

.app-main {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-sm);
  box-sizing: border-box;
  background-color: var(--bg-color-page, #f0f2f5);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.3);
    border-radius: 3px;

    &:hover {
      background-color: rgba(144, 147, 153, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

/* 页面过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all var(--transition-duration-base, 0.3s);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
