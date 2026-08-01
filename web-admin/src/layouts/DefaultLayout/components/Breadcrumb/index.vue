<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span
          v-if="item.redirect === 'noRedirect' || index === levelList.length - 1"
          class="no-redirect"
        >
          {{ item.meta.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ item.meta.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
/**
 * Breadcrumb - 面包屑导航组件
 * @description 参考若依/nest-admin 实现，根据当前路由 matched 自动生成面包屑
 *
 * @特性
 * - 首项固定为「首页」（/dashboard），可在非首页页面点击返回
 * - 末项（当前页）显示为灰色纯文本，不可点击
 * - redirect 为 'noRedirect' 的中间项也显示为纯文本
 * - 其余中间项可点击跳转，优先使用 redirect 目标
 * - 支持 breadcrumb 切换动画
 *
 * @依赖
 * - 路由 meta.title：用于显示面包屑文本
 * - 路由 meta.breadcrumb：设为 false 时该项不显示在面包屑中
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched } from 'vue-router'

const route = useRoute()
const router = useRouter()

/** 面包屑层级列表 */
const levelList = ref<RouteLocationMatched[]>([])

/**
 * 生成面包屑列表
 * @description
 * 1. 取 route.matched 中含 meta.title 的项
 * 2. 若首项不是首页，则在最前插入「首页」
 * 3. 过滤掉 meta.breadcrumb === false 的项
 */
function getBreadcrumb() {
  let matched = route.matched.filter((item) => item.meta && item.meta.title)

  const first = matched[0]
  if (first && first.path !== '/dashboard') {
    matched = [
      { path: '/dashboard', meta: { title: '首页' } } as RouteLocationMatched,
      ...matched,
    ]
  }

  levelList.value = matched.filter(
    (item) => item.meta && item.meta.title && item.meta.breadcrumb !== false,
  )
}

/**
 * 点击面包屑跳转
 * @description 优先使用 redirect，其次使用 path
 * @param item 面包屑项
 */
function handleLink(item: RouteLocationMatched) {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect as string)
    return
  }
  router.push(path)
}

watch(
  () => route.path,
  () => getBreadcrumb(),
  { immediate: true },
)
</script>

<style lang="scss" scoped>
/**
 * 面包屑样式（参考若依）
 * - inline-block 布局，紧贴折叠按钮右侧
 * - 行高与 navbar 一致（50px）
 * - 末项灰色不可点击，可点击项 hover 变为主题色
 */
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }

  a {
    display: inline-block;
    color: var(--el-text-color-primary);
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

/* 面包屑切换动画 */
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.5s;
}

.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(20px);
}

.breadcrumb-leave-active {
  position: absolute;
}
</style>
