# 国际化目录

## 📁 目录说明

存放多语言配置文件，支持 i18n 国际化。

## 📂 目录结构

```
locale/
├── zh-CN.ts             # 中文语言包
├── en-US.ts             # 英文语言包
├── index.ts             # i18n 配置
└── ...
```

## 🔧 使用方式

```vue
<template>
  {{ $t('common.confirm') }}
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
console.log(t('common.confirm'))
</script>
```

## ⚠️ 注意事项

- 语言包按模块拆分，便于维护
- Key 使用点分隔符分层级
- 默认语言与 fallback 语言配置
- 支持动态切换语言
