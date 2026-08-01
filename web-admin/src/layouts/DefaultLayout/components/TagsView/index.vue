<template>
  <div ref="tagsViewRef" class="tags-view-container" @wheel.prevent="handleScroll">
    <div class="tags-view-wrapper" :style="{ left: tagBodyLeft + 'px' }">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        ref="tagRefs"
        :to="{ path: tag.path, query: tag.query }"
        :class="['tags-view-item', { active: isActive(tag) }]"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        {{ tag.meta?.title }}
        <el-icon
          v-if="!isAffix(tag)"
          class="el-icon-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </div>

    <!-- 右键菜单 -->
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">刷新页面</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">关闭当前</li>
      <li @click="closeOthersTags">关闭其他</li>
      <li @click="closeAllTags(selectedTag)">关闭所有</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * TagsView - 标签页导航组件
 * @description 参考若依/nest-admin 实现，展示已访问路由标签，支持关闭、右键菜单、缓存联动
 *
 * @特性
 * - 根据路由 visitedViews 自动生成标签
 * - meta.affix 标签固定在最前且不可关闭
 * - 当前标签高亮显示
 * - 右键菜单：刷新/关闭当前/关闭其他/关闭所有
 * - 鼠标滚轮横向滚动标签
 * - 中键点击关闭标签
 * - 支持 Element Plus 深色主题自动适配
 *
 * @依赖
 * - appStore.visitedViews
 * - appStore.cachedViews
 * - 路由 meta.title / meta.affix / meta.noCache
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalized, type RouteRecordRaw } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/modules/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

/** 标签容器 DOM */
const tagsViewRef = ref<HTMLDivElement>()
/** 标签 DOM 引用数组 */
const tagRefs = ref<HTMLElement[]>([])

/** 标签列表 */
const visitedViews = computed(() => appStore.visitedViews)

/** 当前激活标签 */
const selectedTag = ref<RouteLocationNormalized>({} as RouteLocationNormalized)

/** 右键菜单显示状态 */
const visible = ref(false)
/** 右键菜单位置 */
const top = ref(0)
const left = ref(0)

/** 标签容器滚动偏移 */
const tagBodyLeft = ref(0)

/**
 * 判断标签是否为当前路由
 * @param currentRoute 标签对应路由
 */
function isActive(currentRoute: RouteLocationNormalized) {
  return currentRoute.path === route.path
}

/**
 * 判断标签是否为固定标签
 * @param currentRoute 标签对应路由
 */
function isAffix(currentRoute: RouteLocationNormalized) {
  return currentRoute.meta && currentRoute.meta.affix
}

/**
 * 过滤可固定的标签
 * @param routes 路由列表
 * @param basePath 基础路径
 */
function filterAffixTags(routes: RouteRecordRaw[], basePath = '/'): RouteLocationNormalized[] {
  let tags: RouteLocationNormalized[] = []

  routes.forEach((currentRoute) => {
    if (currentRoute.meta && currentRoute.meta.affix) {
      const tagPath = currentRoute.path.startsWith('/')
        ? currentRoute.path
        : `${basePath}/${currentRoute.path}`
      tags.push({
        path: tagPath,
        fullPath: tagPath,
        name: currentRoute.name,
        meta: currentRoute.meta,
      } as RouteLocationNormalized)
    }

    if (currentRoute.children) {
      const tempTags = filterAffixTags(currentRoute.children, currentRoute.path)
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags]
      }
    }
  })

  return tags
}

/**
 * 初始化固定标签
 */
function initTags() {
  const affixTags = filterAffixTags(router.getRoutes())
  for (const tag of affixTags) {
    if (tag.name) {
      appStore.addVisitedView(tag)
    }
  }
}

/**
 * 添加当前标签
 */
function addTags() {
  const { name } = route
  if (name) {
    appStore.addView(route as RouteLocationNormalized)
  }
}

/**
 * 移动到当前激活标签位置
 */
function moveToCurrentTag() {
  nextTick(() => {
    const tags = tagRefs.value.filter(Boolean)
    for (const tag of tags) {
      if ((tag as any).to.path === route.path) {
        moveToTarget(tag as HTMLElement)
        break
      }
    }
  })
}

/**
 * 滚动到指定标签
 * @param tag 目标标签元素
 */
function moveToTarget(tag: HTMLElement) {
  const outerWidth = tagsViewRef.value?.offsetWidth || 0
  const innerWidth = tagsViewRef.value?.scrollWidth || 0
  const tagOffsetLeft = tag.offsetLeft
  const tagOffsetWidth = tag.offsetWidth

  if (tagOffsetLeft < -tagBodyLeft.value) {
    // 标签在可视区域左侧
    tagBodyLeft.value = -tagOffsetLeft + 8
  } else if (tagOffsetLeft + tagOffsetWidth > outerWidth - tagBodyLeft.value) {
    // 标签在可视区域右侧
    tagBodyLeft.value = outerWidth - tagOffsetLeft - tagOffsetWidth - 8
  }

  // 容器空间足够时回正
  if (innerWidth <= outerWidth) {
    tagBodyLeft.value = 0
  } else if (tagBodyLeft.value < outerWidth - innerWidth) {
    tagBodyLeft.value = outerWidth - innerWidth
  }
}

/**
 * 刷新当前标签
 * @param view 目标路由
 */
function refreshSelectedTag(view: RouteLocationNormalized) {
  appStore.delCachedView(view)
  const { fullPath } = view
  nextTick(() => {
    router.replace({ path: `/redirect${fullPath}` }).catch(() => {
      // redirect 路由不存在时直接重载当前路由
      router.replace({ path: fullPath })
    })
  })
}

/**
 * 关闭当前标签
 * @param view 目标路由
 */
function closeSelectedTag(view: RouteLocationNormalized) {
  appStore.delView(view)
  if (isActive(view)) {
    toLastView(visitedViews.value, view)
  }
}

/**
 * 关闭其他标签
 */
function closeOthersTags() {
  router.push(selectedTag.value)
  appStore.delOthersViews(selectedTag.value)
  moveToCurrentTag()
}

/**
 * 关闭所有标签
 * @param view 当前右键的标签
 */
function closeAllTags(view: RouteLocationNormalized) {
  const { visitedViews } = appStore
  if (visitedViews.some((v) => v.meta.affix && v.path !== view.path)) {
    // 存在其他固定标签，跳转到最后一个固定标签
    const lastAffix = visitedViews.filter((v) => v.meta.affix).pop()
    if (lastAffix) {
      router.push(lastAffix.fullPath || lastAffix.path)
    }
  } else {
    appStore.delAllViews(view)
    if (visitedViews.some((v) => v.meta.affix)) {
      const lastAffix = visitedViews.filter((v) => v.meta.affix).pop()
      if (lastAffix) {
        router.push(lastAffix.fullPath || lastAffix.path)
      }
    } else {
      router.push('/')
    }
  }
}

/**
 * 关闭标签后跳转到相邻标签
 */
function toLastView(views: RouteLocationNormalized[], view: RouteLocationNormalized) {
  const latestView = views.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath || latestView.path)
  } else {
    // 没有标签时跳转首页
    if (view.name === 'Dashboard') {
      router.replace({ path: `/redirect${view.fullPath}` })
    } else {
      router.push('/')
    }
  }
}

/**
 * 打开右键菜单
 */
function openMenu(tag: RouteLocationNormalized, e: MouseEvent) {
  const menuMinWidth = 105
  const offsetLeft = tagsViewRef.value?.getBoundingClientRect().left || 0
  const offsetWidth = tagsViewRef.value?.offsetWidth || 0
  const maxLeft = offsetWidth - menuMinWidth
  const leftPosition = e.clientX - offsetLeft + 15

  left.value = leftPosition > maxLeft ? maxLeft : leftPosition
  top.value = e.clientY - (tagsViewRef.value?.getBoundingClientRect().top || 0)
  visible.value = true
  selectedTag.value = tag
}

/**
 * 关闭右键菜单
 */
function closeMenu() {
  visible.value = false
}

/**
 * 鼠标滚轮横向滚动
 */
function handleScroll(e: WheelEvent) {
  const eventDelta = (e as any).wheelDelta || -e.deltaY * 40
  const $container = tagsViewRef.value
  const $containerWidth = $container?.offsetWidth || 0
  const $wrapperWidth = $container?.scrollWidth || 0

  if (eventDelta > 0) {
    tagBodyLeft.value = Math.min(0, tagBodyLeft.value + eventDelta)
  } else {
    if ($containerWidth - eventDelta >= $wrapperWidth) {
      tagBodyLeft.value = $containerWidth - $wrapperWidth
    } else {
      tagBodyLeft.value = Math.max(tagBodyLeft.value + eventDelta, $containerWidth - $wrapperWidth)
    }
  }
}

watch(
  () => route.path,
  () => {
    addTags()
    moveToCurrentTag()
  },
)

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})

onMounted(() => {
  initTags()
  addTags()
  moveToCurrentTag()
})
</script>

<style lang="scss" scoped>
/**
 * TagsView 样式（参考若依）
 * - 使用 Element Plus CSS 变量适配浅色/深色主题
 * - 当前标签主题色背景
 */
.tags-view-container {
  height: 34px;
  width: 100%;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color, #d8dce5);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.12),
    0 0 3px 0 rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  .tags-view-wrapper {
    height: 100%;
    white-space: nowrap;
    position: relative;
    transition: left 0.3s;

    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 26px;
      border: 1px solid var(--el-border-color, #d8dce5);
      color: var(--el-text-color-primary, #495060);
      background: var(--el-bg-color, #fff);
      padding: 0 8px;
      font-size: 12px;
      margin-left: 5px;
      margin-top: 4px;
      text-decoration: none;
      border-radius: 3px;

      &:first-of-type {
        margin-left: 15px;
      }

      &:last-of-type {
        margin-right: 15px;
      }

      &.active {
        background-color: var(--el-color-primary);
        color: #fff;
        border-color: var(--el-color-primary);

        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }

      &:hover {
        color: var(--el-color-primary);

        &.active {
          color: #fff;
        }
      }

      .el-icon-close {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        text-align: center;
        margin-left: 4px;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        transform-origin: 100% 50%;
        position: relative;
        top: 2px;

        &:hover {
          background-color: var(--el-color-info-light-7, #b4bccc);
          color: #fff;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: var(--el-bg-color-overlay, #fff);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-primary, #333);
    box-shadow: var(--el-box-shadow-light);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;

      &:hover {
        background: var(--el-fill-color-light, #eee);
      }
    }
  }
}
</style>
