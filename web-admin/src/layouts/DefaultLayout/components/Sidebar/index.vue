<template>
  <div class="sidebar-container">
    <!-- 顶部品牌区（mix 布局时 Logo 位于顶部导航栏，此处不展示） -->
    <div v-if="!isMix" class="sidebar-logo" :class="{ 'is-collapse': isCollapse }">
      <img class="sidebar-logo-img" src="/logo.jpg" alt="logo" />
      <span v-show="!isCollapse" class="sidebar-logo-title">{{ appTitle }}</span>
    </div>

    <el-menu
      v-if="displayedMenus.length > 0"
      :default-active="activeMenu"
      :collapse="isCollapse"
      :unique-opened="true"
      :router="true"
      :background-color="menuBackgroundColor"
      :text-color="menuTextColor"
      :active-text-color="menuActiveTextColor"
      class="sidebar-el-menu"
      :class="{ 'is-mix': isMix }"
      :collapse-transition="true"
    >
      <SidebarItem v-for="route in displayedMenus" :key="route.path" :item="route" />
    </el-menu>
    <!-- mix 模式且无二级菜单时的占位 -->
    <div v-else-if="isMix" class="mix-menu-empty">
      <el-icon><Menu /></el-icon>
      <span>请选择顶部一级菜单</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Sidebar - 侧边栏导航组件
 * @description 后台管理系统侧边栏，从路由配置中自动提取菜单数据。
 * 根据整体布局模式呈现两种形态：
 *
 * - sidebar（侧边栏布局）：展示完整菜单树（默认，经典后台）
 * - mix（混合布局）：展示当前激活一级菜单对应的二级菜单（联动顶部一级菜单）
 *
 * 核心特性：
 * - 📂 动态菜单：自动从 Vue Router 路由配置中生成菜单，无需手动维护
 * - 🔄 折叠支持：支持展开/折叠状态切换（配合 Navbar 的 Hamburger 按钮）
 * -  图标渲染：通过 iconMap 自动解析图标组件
 * - 🔗 路由跳转：点击菜单项自动导航到对应页面
 * - 📊 多级嵌套：支持无限层级的子菜单（el-sub-menu 递归）
 * - ✨ 高亮当前：自动高亮当前激活的菜单项
 * - 🧭 mix 联动：混合布局下左侧菜单跟随顶部一级菜单切换
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
import { Menu } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/modules/app'
import { useMenu, type MenuRoute } from '@/hooks/useMenu'
import config from '@/config'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const { menuRoutes } = useMenu()

/** 系统名称（品牌区展示，统一来自应用配置） */
const appTitle = config.appTitle

/** 当前是否为混合布局（mix） */
const isMix = computed(() => appStore.layoutMode === 'mix')

const isCollapse = computed(() => appStore.sidebarCollapsed)

const activeMenu = computed(() => {
  return (route.meta?.activeMenu as string) || route.path
})

/** 当前激活的一级菜单项（mix 模式使用，用于联动左侧二级菜单） */
const activeTopItem = computed<MenuRoute | null>(() => {
  if (!isMix.value) return null
  const currentPath = route.path
  let matched: MenuRoute | null = null
  for (const top of menuRoutes.value) {
    const topPath = top.path
    if (currentPath === topPath || currentPath.startsWith(`${topPath}/`)) {
      if (!matched || topPath.length > matched.path.length) {
        matched = top
      }
    }
  }
  return matched
})

/**
 * 实际展示的菜单：
 * - sidebar 布局：完整菜单树
 * - mix 布局：当前一级菜单的二级菜单；若一级为叶子（无二级），则展示其自身
 */
const displayedMenus = computed<MenuRoute[]>(() => {
  if (!isMix.value) return menuRoutes.value
  const top = activeTopItem.value
  if (!top) return []
  const children = (top.children ?? []).filter((child) => !child.hidden)
  return children.length > 0 ? children : [top]
})

/**
 * mix 布局使用与导航栏一致的背景（浅色 #ffffff / 深色自动跟随 --bg-color-base），
 * 文字/激活色同样跟随主题变量，深浅色模式下均协调
 */
const menuBackgroundColor = computed(() =>
  isMix.value ? 'var(--bg-color-base, #ffffff)' : 'var(--sidebar-bg-color, #304156)',
)
const menuTextColor = computed(() =>
  isMix.value ? 'var(--text-color-primary, #303133)' : 'var(--sidebar-text-color, #bfcbd9)',
)
const menuActiveTextColor = computed(() =>
  isMix.value ? 'var(--color-primary, #409eff)' : 'var(--sidebar-active-text-color, #409eff)',
)
</script>

<style lang="scss" scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 顶部品牌区：Logo + 系统名称 */
.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  height: var(--navbar-height, 50px);
  background-color: var(--sidebar-logo-bg-color, #263445);
  overflow: hidden;

  .sidebar-logo-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .sidebar-logo-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--sidebar-text-color, #bfcbd9);
    white-space: nowrap;
  }
}

.sidebar-el-menu {
  border-right: none;
  flex: 1;
  min-height: 0;
  width: 210px;
  overflow-y: auto;
  overflow-x: hidden;

  /* 隐藏滚动条（保持视觉整洁，滚轮仍可滚动） */
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  &:not(.el-menu--collapse) {
    width: 210px;
  }

  &.el-menu--collapse {
    width: 64px;
  }

  /* mix 布局：浅色菜单时补充分割线 */
  &.is-mix {
    border-right: 1px solid var(--el-border-color-lighter, #ebeef5);
  }
}

.mix-menu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-height: 0;
  width: 210px;
  /* 与 mix 模式侧边栏（--bg-color-base）保持一致，深浅色均适配 */
  background-color: var(--bg-color-base, #ffffff);
  color: var(--text-color-secondary, #909399);
  font-size: 13px;
  border-right: 1px solid var(--el-border-color-lighter, #ebeef5);

  .el-icon {
    font-size: 28px;
    opacity: 0.6;
  }
}
</style>
