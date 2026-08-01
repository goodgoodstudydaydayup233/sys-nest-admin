<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="isCollapse"
    :unique-opened="true"
    :router="true"
    background-color="var(--sidebar-bg-color, #304156)"
    text-color="var(--sidebar-text-color, #bfcbd9)"
    active-text-color="var(--sidebar-active-text-color, #409EFF)"
    class="sidebar-el-menu"
    :collapse-transition="true"
  >
    <SidebarItem v-for="route in menuRoutes" :key="route.path" :item="route" />
  </el-menu>
</template>

<script setup lang="ts">
/**
 * Sidebar - 侧边栏导航组件
 * @description 后台管理系统侧边栏，从路由配置中自动提取菜单数据
 *
 * 核心特性：
 * - 📂 动态菜单：自动从 Vue Router 路由配置中生成菜单，无需手动维护
 * - 🔄 折叠支持：支持展开/折叠状态切换（配合 Navbar 的 Hamburger 按钮）
 * - 🎨 图标渲染：通过 iconMap 自动解析图标组件
 * - 🔗 路由跳转：点击菜单项自动导航到对应页面
 * - 📊 多级嵌套：支持无限层级的子菜单（el-sub-menu 递归）
 * - ✨ 高亮当前：自动高亮当前激活的菜单项
 *
 * 菜单数据来源：
 * 使用 useMenu Hook 从 router.options.routes 中提取可见路由，
 * 遵循通用后台规范：
 *   - 单子路由：提升为顶级菜单（不显示父级目录）
 *   - 多子路由：显示为可展开的目录结构
 *   - hidden: true 的路由不显示在菜单中
 *
 * @example 在 DefaultLayout 中使用
 * ```vue
 * <el-aside :width="sidebarWidth">
 *   <Sidebar />
 * </el-aside>
 * ```
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useMenu } from '@/hooks/useMenu'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const { menuRoutes } = useMenu()

const isCollapse = computed(() => appStore.sidebarCollapsed)

const activeMenu = computed(() => {
  return (route.meta?.activeMenu as string) || route.path
})
</script>

<style lang="scss" scoped>
.sidebar-el-menu {
  border-right: none;
  height: 100%;
  width: 210px;

  &:not(.el-menu--collapse) {
    width: 210px;
  }

  &.el-menu--collapse {
    width: 64px;
  }
}
</style>
