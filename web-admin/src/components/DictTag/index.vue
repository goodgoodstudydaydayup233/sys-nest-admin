<template>
  <!--
    DictTag 字典标签组件
    @description 根据字典数据和值渲染 el-tag
    @example
    ```vue
    <DictTag :options="sexDict" :value="row.sex" />
    ```
  -->
  <template v-if="displayItem">
    <el-tag
      v-if="displayItem.listClass"
      :type="tagType"
      :effect="effect"
      :size="size"
      disable-transitions
    >
      {{ displayItem.label }}
    </el-tag>
    <span v-else :class="displayItem.cssClass || undefined">{{ displayItem.label }}</span>
  </template>
  <span v-else>{{ fallback }}</span>
</template>

<script setup lang="ts">
/**
 * DictTag - 字典标签渲染组件
 * @description 根据 `options` 字典数据和 `value` 字典值，渲染对应标签
 * 优先使用 `listClass` 渲染 el-tag；若 listClass 为空则用 cssClass 渲染纯文本
 *
 * @props options - 字典数据列表（来自 useDict 的 dictData）
 * @props value - 需要渲染的字典值
 * @props size - el-tag 尺寸，默认 'small'
 * @props effect - el-tag 主题，默认 'light'
 * @props fallback - 未匹配到字典项时的回退文案，默认 '-'
 */
import { computed } from 'vue'
import type { DictDataVo } from '@/api/system'

const props = withDefaults(
  defineProps<{
    /** 字典数据列表 */
    options: DictDataVo[]
    /** 字典值 */
    value: string | number | undefined | null
    /** el-tag 尺寸 */
    size?: 'large' | 'default' | 'small'
    /** el-tag 主题 */
    effect?: 'dark' | 'light' | 'plain'
    /** 未匹配时的回退文案 */
    fallback?: string
  }>(),
  {
    size: 'small',
    effect: 'light',
    fallback: '-',
  },
)

/** 当前值匹配到的字典项 */
const displayItem = computed<DictDataVo | undefined>(() => {
  if (props.value === undefined || props.value === null || props.value === '') {
    return undefined
  }
  return props.options.find((d) => String(d.value) === String(props.value))
})

/** el-tag type 映射（listClass 字符串 → el-tag type） */
const tagType = computed<'' | 'success' | 'info' | 'warning' | 'danger'>(() => {
  const map: Record<string, '' | 'success' | 'info' | 'warning' | 'danger'> = {
    default: '',
    primary: '',
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'danger',
  }
  return map[displayItem.value?.listClass ?? ''] ?? ''
})
</script>
