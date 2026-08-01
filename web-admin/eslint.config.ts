import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,

  // 自定义规则配置
  {
    rules: {
      /**
       * 关闭 Vue 组件名多单词要求
       * @description 允许使用单词命名的组件（如 ThemeSwitch、Sidebar 等）
       * @reason 企业级项目中，部分通用组件使用单词命名更简洁直观
       */
      'vue/multi-word-component-names': 'off',

      /**
       * 关闭组件名必须符合 PascalCase 检查
       * @description 允许更灵活的命名方式（如 kebab-case 文件名）
       */
      'vue/component-name-in-template-casing': 'off',

      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
