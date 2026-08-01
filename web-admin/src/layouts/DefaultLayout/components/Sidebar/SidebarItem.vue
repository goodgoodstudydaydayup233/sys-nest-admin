<template>
  <div v-if="!item.hidden">
    <!-- 无子路由：显示为菜单项 -->
    <template v-if="!hasChildren">
      <el-menu-item :index="item.path">
        <el-icon v-if="item.meta?.icon && resolveIcon(item.meta.icon)">
          <component :is="resolveIcon(item.meta.icon)" />
        </el-icon>
        <template #title>
          <span>{{ item.meta?.title }}</span>
        </template>
      </el-menu-item>
    </template>

    <!-- 有子路由：显示为子菜单 -->
    <el-sub-menu v-else :index="item.path">
      <template #title>
        <el-icon v-if="item.meta?.icon && resolveIcon(item.meta.icon)">
          <component :is="resolveIcon(item.meta.icon)" />
        </el-icon>
        <span v-show="!isCollapse" class="sub-menu-title">{{ item.meta?.title }}</span>
      </template>

      <SidebarItem v-for="child in item.children" :key="child.path" :item="child" />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
/**
 * SidebarItem - 递归菜单项组件
 * @description 支持无限层级嵌套的侧边栏菜单项，用于渲染动态路由生成的菜单树
 *
 * 渲染逻辑：
 * - 无子路由 → 渲染为 el-menu-item（叶子节点），点击由 vue-router 跳转
 * - 有子路由 → 渲染为 el-sub-menu（目录节点），内部递归调用自身
 * - 外链（meta.link / meta.path 为 URL）→ 路由映射到 InnerLink 组件，在内容区以 iframe 内嵌展示。
 * - hidden: true 的菜单项不渲染（由父级 v-if 控制）
 * - 图标通过 resolveIcon 函数从 iconMap 中解析对应的 Element Plus 图标组件
 *
 * 数据来源：
 * 接收 MenuRoute 类型的 props，该类型由 useMenu Hook 从路由配置中提取
 *
 * @example 在 Sidebar 中使用
 * ```vue
 * <SidebarItem v-for="route in menuRoutes" :key="route.path" :item="route" />
 * ```
 */
import { computed } from 'vue'
import { resolveIcon } from '@/utils/iconMap'
import { useAppStore } from '@/stores/modules/app'
import type { MenuRoute } from '@/hooks/useMenu'

const props = defineProps<{
  /** 菜单项数据（从路由配置中提取）*/
  item: MenuRoute
}>()

const appStore = useAppStore()
const isCollapse = computed(() => appStore.sidebarCollapsed)

/** 判断是否有可见子路由 */
const hasChildren = computed(() => {
  return (
    props.item.children &&
    props.item.children.length > 0 &&
    props.item.children.some((child) => !child.hidden)
  )
})
</script>
