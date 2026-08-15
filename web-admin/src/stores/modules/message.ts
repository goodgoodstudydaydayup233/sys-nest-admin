import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { messageApi } from '@/api/system'
import { getAccessToken } from '@/utils/auth'
import config from '@/config'

/** SSE 连接句柄（模块级单例，连接与 store 实例一一对应） */
let sseSource: EventSource | null = null

/**
 * 站内信全局状态
 * @description 维护「本人未读数」并提供 SSE 实时推送能力：
 *
 * - 未读数：供顶部导航铃铛与收件箱页面共享，避免各页面各自拉取造成状态不同步
 * - SSE：后端主动推送 new-message 事件，前端收到后刷新未读数并弹出系统通知，
 *   替代旧的固定 60s 轮询，保证实时性（EventSource 断线后自动重连）
 *
 * @example 在组件中使用
 * ```vue
 * <script setup lang="ts">
 * import { useMessageStore } from '@/stores/modules/message'
 * const messageStore = useMessageStore()
 * // 建立 SSE 连接（导航栏挂载后调用）
 * messageStore.initSse()
 * // 关闭 SSE 连接（登出/切换 token 时调用）
 * messageStore.closeSse()
 * // 读取未读数 / 手动拉取
 * messageStore.unreadCount
 * messageStore.fetchUnreadCount()
 * </script>
 * ```
 */
export const useMessageStore = defineStore('message', () => {
  /** 本人未读站内信数量 */
  const unreadCount = ref(0)

  /**
   * 从后端拉取本人未读数
   * @description 失败时静默忽略（保留旧值），避免影响页面主流程
   */
  async function fetchUnreadCount(): Promise<void> {
    try {
      const { count } = await messageApi.getUnreadCount()
      unreadCount.value = count
    } catch {
      // 拉取失败保留旧值，错误由请求拦截器统一提示
    }
  }

  /**
   * 主动设置未读数
   * @description 用于本地即时同步（如阅读/删除后），避免每次都重新请求接口
   * @param count 新的未读数
   */
  function setUnreadCount(count: number): void {
    unreadCount.value = count
  }

  /**
   * 建立站内信 SSE 长连接（后端主动推送）
   * @description
   * - 通过 EventSource 订阅 /system/message/sse（token 走 query，因 EventSource 无法携带请求头）
   * - 收到 new-message 事件后刷新未读数，并弹出系统通知提示
   * - 连接断开时 EventSource 内置自动重连，无需手动处理
   * - 重复调用不会建立多条连接（已有连接直接跳过）
   */
  function initSse(): void {
    if (sseSource) return

    const token = getAccessToken()
    if (!token) return

    const base = config.apiBaseUrl.replace(/\/$/, '')
    const url = `${base}/system/message/sse?token=${encodeURIComponent(token)}`

    try {
      sseSource = new EventSource(url)
    } catch {
      sseSource = null
      return
    }

    // 后端推送新消息事件：刷新未读数 + 系统通知提示
    sseSource.addEventListener('new-message', () => {
      fetchUnreadCount()
      ElNotification({
        title: '新站内信',
        message: '您有一条新的站内信，请及时查看',
        type: 'info',
        position: 'bottom-right',
        duration: 4000,
      })
    })

    // 连接异常由 EventSource 自动重连；无需在 onerror 中处理
    sseSource.onerror = () => {}
  }

  /**
   * 关闭 SSE 连接
   * @description 在登出或 token 刷新重建连接前调用，避免旧 token 连接持续重试
   */
  function closeSse(): void {
    if (sseSource) {
      sseSource.close()
      sseSource = null
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    setUnreadCount,
    initSse,
    closeSse,
  }
})
