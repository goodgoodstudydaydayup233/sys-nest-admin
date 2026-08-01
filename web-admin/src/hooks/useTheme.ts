/**
 * 主题切换 Composable（组合式函数）
 * @description 在 Vue 组件中使用的主题相关响应式状态和方法
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@/hooks/useTheme'
 * 
 * const { isDark, mode, toggle, setMode } = useTheme()
 * </script>
 * ```
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getThemeMode,
  setThemeMode,
  toggleTheme,
  isDarkMode,
  type ThemeMode,
} from '@/utils/theme'

export function useTheme() {
  /** 当前主题模式（响应式）*/
  const mode = ref<ThemeMode>('light')
  
  /** 是否为深色模式（计算属性，便于模板中使用）*/
  const isDark = computed(() => mode.value === 'dark')
  
  /** 是否为浅色模式 */
  const isLight = computed(() => mode.value === 'light')

  /**
   * 切换主题
   */
  function toggle() {
    const newMode = toggleTheme()
    mode.value = newMode
    return newMode
  }

  /**
   * 设置指定主题模式
   */
  function setMode(newMode: ThemeMode) {
    setThemeMode(newMode)
    mode.value = newMode
  }

  /**
   * 监听主题变化事件
   */
  let unbindEvent: (() => void) | null = null
  
  onMounted(() => {
    // 初始化当前主题
    mode.value = getThemeMode()
    
    // 监听其他地方触发的主题变化（如系统偏好变化、其他标签页同步等）
    const handler = (event: CustomEvent) => {
      mode.value = event.detail.mode
    }
    
    window.addEventListener('themechange', handler as EventListener)
    
    unbindEvent = () => {
      window.removeEventListener('themechange', handler as EventListener)
    }
  })

  onUnmounted(() => {
    unbindEvent?.()
  })

  return {
    mode,           // 当前模式：'light' | 'dark'
    isDark,         // 是否深色模式（布尔值）
    isLight,        // 是否浅色模式（布尔值）
    toggle,         // 切换方法
    setMode,        // 设置方法
  }
}
