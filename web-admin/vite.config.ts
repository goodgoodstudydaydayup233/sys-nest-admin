import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage } from 'node:http'
import { loadEnv, type ConfigEnv, type UserConfig } from 'vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'

/**
 * Vite 配置文件
 * @description 支持多环境配置、开发代理、路径别名等功能
 * @see https://vitejs.dev/config/
 */

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  /**
   * 加载对应模式的环境变量
   * - development: 开发环境 (.env + .env.development)
   * - production: 生产环境 (.env + .env.production)
   */
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/hooks', 'src/stores/modules'],
        vueTemplate: true,
      }),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      cors: true,
      hmr: env.VITE_HMR === 'true',

      proxy: {
        '/dev-api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              const request = req as IncomingMessage & { originalUrl?: string }
              const requestPath = request.originalUrl || request.url || 'unknown'
              console.log('Proxying:', req.method, requestPath, '→', options.target)
            })
          },
        },
        '/uploads': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },

    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: env.VITE_SOURCE_MAP === 'true',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          /**
           * 代码分割策略
           * @description 将第三方库拆分为独立的 chunk，优化加载性能
           * - vendor: Vue 核心库（vue, vue-router, pinia）
           * - elementPlus: UI 组件库（element-plus）
           */
          manualChunks(id: string) {
            // 将 node_modules 中的依赖包按需分包
            if (id.includes('node_modules')) {
              // Vue 核心库打包到 vendor
              if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
                return 'vendor'
              }
              // Element Plus 单独打包
              if (id.includes('element-plus') || id.includes('@element-plus')) {
                return 'elementPlus'
              }
            }
          },
        },
      },
    },

    css: {
      // 预处理器配置（如需使用 SCSS/SASS，请先安装 sass 依赖）
      // preprocessorOptions: {
      //   scss: {
      //     additionalData: `@use "@/assets/styles/variables.scss" as *;`,
      //   },
      // },
    },
  }
})
