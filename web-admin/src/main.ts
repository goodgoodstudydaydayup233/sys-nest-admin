import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// 引入全局主题变量（浅色 + 深色）
import '@/assets/styles/variables-light.css'
import '@/assets/styles/variables-dark.css'
// 引入全局基础样式覆盖（表格风格、搜索区扁平化等）
import '@/assets/styles/index.css'

import App from './App.vue'
import router from './router'
import { initTheme } from '@/utils/theme'
import { setRouter } from '@/utils/request/service'
import { permissions } from '@/directives/permission'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 注入 Router 实例到 HTTP 请求模块（用于 Token 失效时跳转登录页）
setRouter(router)

// 注册权限指令 v-permissions
app.directive('permissions', permissions)

// 初始化路由守卫（处理登录验证、动态路由加载）
import { setupRouterGuards } from './router/guards'
setupRouterGuards(router)

// 初始化主题（恢复用户上次选择或跟随系统）
initTheme()

app.mount('#app')

const loadingEl = document.getElementById('pageLoading')
if (loadingEl) {
  loadingEl.style.opacity = '0'
  setTimeout(() => loadingEl.remove(), 350)
}
