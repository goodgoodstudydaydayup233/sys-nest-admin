# 静态资源目录

## 📁 目录说明

存放项目中的静态资源文件，包括图片、图标、样式等。

## 📂 目录结构

```
assets/
├── images/           # 图片资源
│   ├── logo.png      # Logo 文件
│   └── ...
├── icons/            # 图标资源（SVG）
│   └── ...
└── styles/           # 全局样式
    ├── variables.scss    # SCSS 变量定义
    ├── mixins.scss       # SCSS 混入
    ├── reset.scss        # 样式重置
    ├── global.scss       # 全局样式
    └── element.scss      # Element Plus 样式覆盖
```

## 🔧 使用方式

```vue
<!-- 在组件中使用图片 -->
<img src="@/assets/images/logo.png" alt="Logo" />

<!-- 导入样式 -->
<style lang="scss">
@import '@/assets/styles/variables.scss';
</style>
```

## ⚠️ 注意事项

- 图片建议使用 WebP 格式优化性能
- SVG 图标优先使用 Icon 组件库
- 全局样式统一放在 styles 目录管理
- 避免在组件中写过多行内样式
