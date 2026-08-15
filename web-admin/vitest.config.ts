import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfigFn from './vite.config'

// vite.config.ts 以「函数」形式按环境导出配置，
// vitest 的 mergeConfig 需要对象形式，此处固定以 test 环境解析后再合并
const viteConfig = viteConfigFn({ mode: 'test', command: 'serve' })

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
