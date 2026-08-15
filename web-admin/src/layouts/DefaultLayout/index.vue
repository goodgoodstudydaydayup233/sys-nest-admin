<script lang="tsx">
/**
 * DefaultLayout - 默认布局组件（TSX Render）
 * @description 后台管理系统主布局，根据整体布局模式（app-layout-mode）渲染三种形态：
 *
 * - sidebar（侧边栏布局，默认）：左侧固定侧边栏（完整菜单）+ 右侧顶栏/标签页/内容区
 * - top（顶部导航布局）：无侧边栏，菜单横向展示在顶部导航栏，内容区更开阔
 * - mix（混合布局）：一级菜单在顶部导航栏，二级菜单在左侧，两级联动
 *
 * 布局结构：
 * ┌─────────────────────────────────────────────┐
 * │  Sidebar  │         Navbar                  │
 * │  (Aside)  ├─────────────────────────────────┤
 * │           │         TagsView                │
 * │           ├─────────────────────────────────┤
 * │           │                                 │
 * │           │         AppMain                 │
 * │           │       (Main Content)            │
 * │           │                                 │
 * └───────────┴─────────────────────────────────┘
 *
 * @example 路由配置中使用
 * ```typescript
 * {
 *   path: '/system',
 *   component: () => import('@/layouts/DefaultLayout/index.vue'),
 *   children: [...]
 * }
 * ```
 */
import { defineComponent } from 'vue'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar/index.vue'
import TagsView from './components/TagsView/index.vue'
import AppMain from './components/AppMain/index.vue'
import SettingsDrawer from './components/SettingsDrawer/index.vue'
import { useAppStore } from '@/stores/modules/app'

export default defineComponent({
  name: 'DefaultLayout',
  setup() {
    const appStore = useAppStore()
    return { appStore }
  },
  render() {
    const { layoutMode } = this.appStore
    const isTop = layoutMode === 'top'
    const isMix = layoutMode === 'mix'

    return (
      <div class="default-layout">
        <div class="layout-container">
          {/* sidebar / mix 布局渲染侧边栏（mix 时内部联动展示二级菜单） */}
          {!isTop && (
            <div class="sidebar-wrapper">
              <Sidebar />
            </div>
          )}

          <div class="main-wrapper">
            <div class="navbar-wrapper">
              <Navbar variant={isTop ? 'top' : isMix ? 'mix' : 'normal'} />
            </div>
            <div class="tags-view-wrapper">
              <TagsView />
            </div>
            <div class="app-main-wrapper">
              <AppMain />
            </div>
          </div>
        </div>

        {/* 系统设置抽屉（右上角「系统设置」打开） */}
        <SettingsDrawer />
      </div>
    )
  },
})
</script>

<style lang="scss" scoped>
/**
 * DefaultLayout 布局样式
 * @description 采用 Flexbox 实现经典后台布局，确保无多余滚动条
 *
 * 布局高度继承链：
 * html/body (#app) → .default-layout (100vh) → .layout-container (100%)
 *   → .sidebar-wrapper (固定宽度) + .main-wrapper (flex: 1)
 *     → .navbar-wrapper (固定高度) + .tags-view-wrapper (固定高度) + .app-main-wrapper (flex: 1, overflow: auto)
 */

.default-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar-wrapper {
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 0;
    display: none;
  }
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.navbar-wrapper {
  flex-shrink: 0;
  height: var(--navbar-height, 50px);
  overflow: hidden;
}

.tags-view-wrapper {
  flex-shrink: 0;
  height: 34px;
  overflow: hidden;
}

.app-main-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
