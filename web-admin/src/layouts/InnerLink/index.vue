<template>
  <div :style="{ height }">
    <iframe :src="link" style="width: 100%; height: 100%; border: none" />
  </div>
</template>

<script setup lang="ts">
/**
 * InnerLink - 内嵌外链组件
 * @description 后端返回 component 为 'InnerLink' 时映射到此组件
 * 用于在系统内部以 iframe 形式展示外部链接页面
 *
 * @example 路由配置（由后端 buildMenus 自动生成）
 * ```typescript
 * {
 *   path: '/inner-link/xxx',
 *   component: 'InnerLink',
 *   meta: { title: '外部链接', icon: 'Link', path: 'https://example.com' }
 * }
 * ```
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

/** 外链地址，优先从 meta.path 获取（内链模式），其次 meta.link */
const link = computed(() => (route.meta?.path as string) || (route.meta?.link as string) || '')

/** 自适应高度：页面高度减去 Navbar 高度 */
const height = computed(() => `${document.documentElement.clientHeight - 94}px`)
</script>
