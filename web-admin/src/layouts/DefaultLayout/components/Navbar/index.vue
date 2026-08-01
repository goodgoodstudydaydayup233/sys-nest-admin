<template>
  <div class="navbar">
    <div class="navbar-left">
      <div class="hamburger-container" @click="toggleSidebar">
        <el-icon :size="20">
          <Fold v-if="!appStore.sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <Breadcrumb class="breadcrumb-container" />
    </div>

    <div class="navbar-right">
      <el-tooltip content="全屏切换" placement="bottom">
        <div class="navbar-action-item" @click="toggleFullscreen">
          <el-icon :size="18">
            <FullScreen />
          </el-icon>
        </div>
      </el-tooltip>

      <ThemeSwitch class="theme-switch-container" />

      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-dropdown">
          <el-avatar :size="32" :src="userStore.avatar || undefined" class="user-avatar">
            {{ userInitial }}
          </el-avatar>
          <span class="username">{{ username }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Navbar - 顶部导航栏组件
 * @description 后台管理系统顶部导航栏，包含以下功能模块：
 *
 * 功能特性：
 * - 🔄 侧边栏折叠/展开切换
 * - 🍞 面包屑导航（自动根据路由生成）
 * - 🌓 主题切换（亮色/暗色模式）
 * - 🔲 全屏切换
 * - 👤 用户下拉菜单（个人中心/系统设置/退出登录）
 *
 * @example 在 DefaultLayout 中使用
 * ```vue
 * <el-header height="50px">
 *   <Navbar />
 * </el-header>
 * ```
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  FullScreen,
  User,
  Setting,
  SwitchButton,
  ArrowDown,
} from '@element-plus/icons-vue'
import Breadcrumb from '../Breadcrumb/index.vue'
import ThemeSwitch from '@/components/ThemeSwitch/index.vue'
import { useAppStore } from '@/stores/modules/app'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const username = computed(() => userStore.nickname || userStore.username)
const userInitial = computed(() => username.value.charAt(0).toUpperCase())

function toggleSidebar() {
  appStore.toggleSidebar()
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else if (document.exitFullscreen) {
    document.exitFullscreen()
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      console.log('个人中心11')
      console.log('当前已注册的所有路由：', router.getRoutes())
      //      router.push('/4041')
      router.push('/account/personal')
      break

    case 'settings':
      router.push('/settings')
      break

    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
        // 用户取消操作，不做处理
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  background-color: var(--navbar-bg-color, #ffffff);
  border-bottom: 1px solid var(--navbar-border-color, #dcdfe6);
  box-sizing: border-box;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .hamburger-container {
    cursor: pointer;
    color: var(--text-color-regular, #5a5e66);
    transition: color var(--el-transition-duration);
    display: flex;
    align-items: center;

    &:hover {
      color: var(--color-primary, #409eff);
    }
  }

  .breadcrumb-container {
    flex: 1;
  }
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;

  .navbar-action-item {
    cursor: pointer;
    color: var(--text-color-regular, #5a5e66);
    transition: color var(--el-transition-duration);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;

    &:hover {
      color: var(--color-primary, #409eff);
    }
  }

  .theme-switch-container {
    display: flex;
    align-items: center;
  }

  .user-dropdown {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--el-border-radius-base, 4px);
    transition: background-color var(--el-transition-duration);

    &:hover {
      background-color: var(--bg-color-page, #f5f7fa);
    }

    .user-avatar {
      background-color: var(--color-primary, #409eff);
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
    }

    .username {
      font-size: 14px;
      color: var(--text-color-primary, #303133);
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-icon {
      color: var(--text-color-secondary, #909399);
      font-size: 12px;
    }
  }
}
</style>
