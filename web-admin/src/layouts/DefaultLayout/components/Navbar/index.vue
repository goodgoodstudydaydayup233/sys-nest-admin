<template>
  <div class="navbar">
    <div class="navbar-left">
      <!-- 顶部/混合布局：品牌 + 横向菜单（top 完整菜单 / mix 仅一级） -->
      <template v-if="variant !== 'normal'">
        <div class="logo-container">
          <img class="logo-img" src="/logo.jpg" alt="logo" />
          <span class="logo-title">{{ appTitle }}</span>
        </div>
        <TopMenu :mode="variant === 'top' ? 'top' : 'mix'" class="top-menu-container" />
      </template>
      <!-- 侧边栏布局：折叠按钮 + 面包屑 -->
      <template v-else>
        <div class="hamburger-container" @click="toggleSidebar">
          <el-icon :size="20">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </div>
        <Breadcrumb class="breadcrumb-container" />
      </template>
    </div>

    <div class="navbar-right">
      <!-- 站内信未读铃铛：角标展示未读数，下拉预览最新未读，点击进入收件箱 -->
      <el-dropdown
        trigger="click"
        popper-class="message-dropdown-popper"
        @command="handleBellCommand"
        @visible-change="handleBellVisibleChange"
      >
        <div class="navbar-action-item bell-container">
          <el-badge
            :value="messageStore.unreadCount"
            :hidden="messageStore.unreadCount <= 0"
            :max="99"
          >
            <el-icon :size="18"><Bell /></el-icon>
          </el-badge>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="message-dropdown">
            <div class="message-dropdown-header">
              <span class="message-dropdown-title">未读消息</span>
              <el-button
                link
                type="primary"
                :disabled="messageStore.unreadCount === 0"
                @click="handleMarkAllRead"
                >全部已读</el-button
              >
            </div>
            <template v-if="latestMessages.length > 0">
              <el-dropdown-item
                v-for="msg in latestMessages"
                :key="msg.id"
                :command="`open-${msg.id}`"
              >
                <div class="message-item">
                  <div class="message-item-title">{{ msg.title }}</div>
                  <div class="message-item-meta">
                    <el-tag size="small" :type="typeTagType(msg.type)">{{
                      typeLabel(msg.type)
                    }}</el-tag>
                    <span class="message-item-time">{{ formatTime(msg.createdAt) }}</span>
                  </div>
                </div>
              </el-dropdown-item>
            </template>
            <div v-else class="message-dropdown-empty">暂无未读消息</div>
            <el-dropdown-item divided command="goto">
              <div class="message-goto">查看全部消息</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

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
 * @description 后台管理系统顶部导航栏，通过 variant 区分三种形态：
 *
 * - normal（默认）：折叠按钮 + 面包屑 + 右侧功能（侧边栏布局使用）
 * - top（顶部布局）：品牌 Logo + 横向完整菜单 + 右侧功能（顶部导航布局使用）
 * - mix（混合布局）：品牌 Logo + 一级横向菜单 + 右侧功能（混合布局使用，一级在顶部、二级在左侧）
 *
 * 功能特性：
 * - 🔄 侧边栏折叠/展开切换（normal 形态）
 * - 🍞 面包屑导航（自动根据路由生成）
 * - 🧭 横向顶部菜单（top 形态）
 * - 🌓 主题切换（亮色/暗色模式）
 * - 🔲 全屏切换
 * - 🔔 站内信未读铃铛（未读角标 + 下拉预览 + 全部已读 + 跳转收件箱，SSE 后端实时推送）
 * - 👤 用户下拉菜单（个人中心/系统设置/退出登录），系统设置打开布局设置抽屉
 *
 * @example 在 DefaultLayout 中使用
 * ```vue
 * <Navbar variant="normal" />
 * <Navbar variant="top" />
 * <Navbar variant="mix" />
 * ```
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  Bell,
} from '@element-plus/icons-vue'
import Breadcrumb from '../Breadcrumb/index.vue'
import ThemeSwitch from '@/components/ThemeSwitch/index.vue'
import TopMenu from '../TopMenu/index.vue'
import { useAppStore } from '@/stores/modules/app'
import { useUserStore } from '@/stores/modules/user'
import { useMessageStore } from '@/stores/modules/message'
import { messageApi } from '@/api/system'
import type { MessageType, MessageVo } from '@/api/system'
import config from '@/config'

/** 系统名称（品牌区展示，统一来自应用配置） */
const appTitle = config.appTitle

const props = withDefaults(
  defineProps<{
    /** 导航栏形态：normal-默认（折叠+面包屑） / top-顶部布局（品牌+完整菜单） / mix-混合布局（品牌+一级菜单） */
    variant?: 'normal' | 'top' | 'mix'
  }>(),
  { variant: 'normal' },
)

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const messageStore = useMessageStore()

const username = computed(() => userStore.nickname || userStore.username)
const userInitial = computed(() => username.value.charAt(0).toUpperCase())

// ==================== 站内信铃铛相关 ====================

/** 最新未读消息预览（最多 5 条） */
const latestMessages = ref<MessageVo[]>([])

/** 消息类型中文名 */
function typeLabel(type: MessageType | undefined): string {
  const map: Record<MessageType, string> = {
    '1': '系统通知',
    '2': '业务提醒',
    '3': '任务结果',
  }
  return type ? (map[type] ?? '-') : '-'
}

/** 消息类型对应的 el-tag 类型 */
function typeTagType(type: MessageType | undefined): 'info' | 'warning' | 'success' {
  const map: Record<MessageType, 'info' | 'warning' | 'success'> = {
    '1': 'info',
    '2': 'warning',
    '3': 'success',
  }
  return type ? (map[type] ?? 'info') : 'info'
}

/** 格式化时间：ISO 转为 YYYY-MM-DD HH:mm */
function formatTime(time: string): string {
  if (!time) return ''
  return time.replace('T', ' ').slice(0, 16)
}

/** 加载最新未读消息预览（下拉展开时调用） */
async function loadLatestUnread() {
  try {
    const { list } = await messageApi.getInbox({ page: 1, pageSize: 5, status: '0' })
    latestMessages.value = list
  } catch {
    latestMessages.value = []
  }
}

/** 全部标记已读 */
async function handleMarkAllRead() {
  try {
    await messageApi.markAllRead()
    messageStore.setUnreadCount(0)
    latestMessages.value = []
    ElMessage.success('已全部标记为已读')
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/** 铃铛下拉命令处理：open-{id} 打开单条未读 / goto 进入收件箱 */
async function handleBellCommand(command: string) {
  if (command.startsWith('open-')) {
    const id = Number(command.replace('open-', ''))
    try {
      await messageApi.markRead(id)
      messageStore.setUnreadCount(Math.max(0, messageStore.unreadCount - 1))
      router.push('/system/message')
    } catch {
      // 错误已由请求拦截器统一提示
    }
    return
  }
  if (command === 'goto') {
    router.push('/system/message')
  }
}

/** 下拉展开时刷新最新未读预览 */
function handleBellVisibleChange(visible: boolean) {
  if (visible) {
    loadLatestUnread()
  }
}

onMounted(() => {
  // 初始化未读数 + 建立 SSE 长连接（后端主动推送，替代固定轮询）
  messageStore.fetchUnreadCount()
  messageStore.initSse()
})

// 登录/token 刷新时重建 SSE 连接（新 token 需重新订阅）
watch(
  () => userStore.token,
  (newToken, oldToken) => {
    if (newToken === oldToken) return
    messageStore.closeSse()
    if (newToken) {
      messageStore.initSse()
    }
  },
)

onBeforeUnmount(() => {
  // 组件卸载（登出跳转登录页）时关闭 SSE 连接
  messageStore.closeSse()
})

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
      router.push('/account/personal')
      break

    case 'settings':
      appStore.openSettings()
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
  flex: 1;
  min-width: 0;

  /* 品牌 Logo 区（顶部/混合布局） */
  .logo-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding-right: 12px;
    border-right: 1px solid var(--navbar-border-color, #dcdfe6);

    .logo-img {
      width: 26px;
      height: 26px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .logo-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color-primary, #303133);
      white-space: nowrap;
    }
  }

  /* 横向菜单容器（顶部/混合布局），占据剩余空间 */
  .top-menu-container {
    flex: 1;
    min-width: 0;
    height: 100%;
  }

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
  flex-shrink: 0;

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

<style lang="scss">
/*
 * 站内信铃铛下拉（全局样式）
 * @description el-dropdown 内容默认渲染到 body，scoped 样式无法命中，
 * 因此通过 popper-class="message-dropdown-popper" 在此处统一控制，并适配深浅色主题。
 */
.message-dropdown-popper {
  .message-dropdown {
    padding: 0;
  }

  /* 头部：标题 + 全部已读 */
  .message-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);

    .message-dropdown-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
    }
  }

  /* 单条未读预览 */
  .message-item {
    padding: 4px 0;
    max-width: 320px;

    .message-item-title {
      font-size: 13px;
      color: var(--el-text-color-primary, #303133);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .message-item-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .message-item-time {
        font-size: 12px;
        color: var(--el-text-color-secondary, #909399);
      }
    }
  }

  /* 无未读消息占位 */
  .message-dropdown-empty {
    padding: 24px 0;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
  }

  /* 查看全部入口 */
  .message-goto {
    font-size: 13px;
    color: var(--el-color-primary, #409eff);
    text-align: center;
  }
}
</style>
