/**
 * NProgress 页面加载进度条配置
 * @description 路由切换时显示顶部进度条，提升用户体验
 *
 * @example 在路由守卫中使用
 * ```typescript
 * import { startProgress, doneProgress } from '@/utils/nprogress'
 *
 * router.beforeEach(() => startProgress())
 * router.afterEach(() => doneProgress())
 * ```
 */
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
  easing: 'ease',
  speed: 300,
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3,
})

/** 开始进度条 */
export function startProgress() {
  NProgress.start()
}

/** 结束进度条 */
export function doneProgress() {
  NProgress.done()
}
