<template>
  <el-menu
    mode="horizontal"
    :default-active="activeTopPath"
    :router="mode === 'top'"
    :ellipsis="false"
    class="top-menu"
    background-color="transparent"
    text-color="var(--navbar-text-color, #606266)"
    active-text-color="var(--color-primary, #409eff)"
  >
    <!-- 混合模式：一级菜单（点击切换左侧二级菜单，或直达叶子页面） -->
    <template v-if="mode === 'mix'">
      <el-menu-item
        v-for="route in menuRoutes"
        :key="route.path"
        :index="route.path"
        class="top-menu-item"
        @click="handleMixClick(route)"
      >
        <el-icon v-if="route.meta?.icon && resolveIcon(route.meta.icon)">
          <component :is="resolveIcon(route.meta.icon)" />
        </el-icon>
        <span>{{ route.meta?.title }}</span>
      </el-menu-item>
    </template>

    <!-- 顶部模式：完整递归菜单（子菜单悬浮展开） -->
    <SidebarItem v-else v-for="route in menuRoutes" :key="route.path" :item="route" />
  </el-menu>
</template>

<script setup lang="ts">
/**
 * TopMenu - 顶部导航菜单
 * @description 根据布局模式渲染两种顶部菜单形态：
 *
 * - top（顶部导航布局）：渲染完整递归菜单，子菜单悬浮（popup）展开，直接点击导航
 * - mix（混合布局）：只渲染一级菜单，点击目录时切换左侧二级菜单并导航到其第一个子页面
 *
 * @使用示例（在 Navbar 中）
 * ```vue
 * <TopMenu mode="top" />
 * <TopMenu mode="mix" />
 * ```
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenu, type MenuRoute } from '@/hooks/useMenu'
import { resolveIcon } from '@/utils/iconMap'
import SidebarItem from '../Sidebar/SidebarItem.vue'

const props = defineProps<{
  /** 菜单形态：top-完整菜单 / mix-仅一级菜单 */
  mode: 'top' | 'mix'
}>()

const route = useRoute()
const router = useRouter()
const { menuRoutes } = useMenu()

/** 当前激活的一级菜单路径 */
const activeTopPath = computed(() => {
  const currentPath = route.path
  let matched = ''
  for (const top of menuRoutes.value) {
    const topPath = top.path
    if (currentPath === topPath || currentPath.startsWith(`${topPath}/`)) {
      if (topPath.length > matched.length) {
        matched = topPath
      }
    }
  }
  return matched || currentPath
})

/** 递归查找第一个可见叶子路径 */
function findFirstLeafPath(item: MenuRoute): string | null {
  if (!item.children?.length) return item.path
  for (const child of item.children) {
    if (child.hidden) continue
    const leafPath = findFirstLeafPath(child)
    if (leafPath) return leafPath
  }
  return null
}

/** 混合模式：点击一级菜单切换导航 */
function handleMixClick(item: MenuRoute) {
  if (item.children?.length) {
    const target = findFirstLeafPath(item)
    if (target) router.push(target)
  } else {
    router.push(item.path)
  }
}
</script>

<style scoped lang="scss">
.top-menu {
  height: 100%;
  border-bottom: none;

  &.el-menu--horizontal {
    --el-menu-horizontal-height: 50px;
  }

  :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;
  }

  :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;
  }
}
</style>
