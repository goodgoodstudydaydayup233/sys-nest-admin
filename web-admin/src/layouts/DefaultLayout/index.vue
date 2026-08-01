<script lang="tsx">
/**
 * DefaultLayout - 默认布局组件（TSX Render）
 * @description 后台管理系统主布局，采用经典后台布局：左侧固定侧边栏 + 右侧顶栏/标签页/内容区
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

export default defineComponent({
  name: 'DefaultLayout',
  render() {
    return (
      <div class="default-layout">
        <div class="layout-container">
          <div class="sidebar-wrapper">
            <Sidebar />
          </div>

          <div class="main-wrapper">
            <div class="navbar-wrapper">
              <Navbar />
            </div>
            <div class="tags-view-wrapper">
              <TagsView />
            </div>
            <div class="app-main-wrapper">
              <AppMain />
            </div>
          </div>
        </div>
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
