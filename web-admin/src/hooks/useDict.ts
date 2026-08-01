/**
 * useDict - 字典数据 Hook
 * @description 业务页面通过字典类型标识获取字典数据
 *
 * @特性
 * - 内存缓存：同一字典类型在一次会话中只请求一次，避免重复请求
 * - 响应式：返回 ref<DictDataVo[]>，字典数据加载后自动更新视图
 * - 工具方法：getDictLabel / getDictTag 用于根据 value 反查 label / listClass
 * - 后端配合：后端 Redis 已缓存字典数据，前端内存缓存进一步减少请求
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDict } from '@/hooks/useDict'
 * import DictTag from '@/components/DictTag/index.vue'
 *
 * // 1. 加载字典
 * const { dictData, getDictLabel } = useDict('sys_user_sex')
 *
 * // 2. 在 select 中使用
 * // <el-option v-for="item in dictData" :key="item.value" :label="item.label" :value="item.value" />
 *
 * // 3. 在表格中根据 value 反查 label
 * // {{ getDictLabel(row.sex) }}
 *
 * // 4. 配合 DictTag 组件渲染带样式标签
 * // <DictTag :options="dictData" :value="row.sex" />
 * </script>
 * ```
 */
import { ref, type Ref } from 'vue'
import { dictDataApi } from '@/api/system'
import type { DictDataVo } from '@/api/system'

/** 字典内存缓存：dictType -> DictDataVo[] */
const dictCache = new Map<string, DictDataVo[]>()

/** 正在加载中的字典 Promise，避免并发重复请求 */
const loadingPromises = new Map<string, Promise<DictDataVo[]>>()

/**
 * 加载字典数据（带内存缓存）
 * @param dictType 字典类型标识
 * @param force 是否强制刷新缓存
 */
async function loadDict(dictType: string, force = false): Promise<DictDataVo[]> {
  // 1. 命中内存缓存直接返回
  if (!force && dictCache.has(dictType)) {
    return dictCache.get(dictType)!
  }

  // 2. 已有正在加载的请求，复用 Promise
  if (loadingPromises.has(dictType)) {
    return loadingPromises.get(dictType)!
  }

  // 3. 发起新请求
  const promise = dictDataApi
    .getDictDataByType(dictType)
    .then((list) => {
      dictCache.set(dictType, list)
      loadingPromises.delete(dictType)
      return list
    })
    .catch((err) => {
      loadingPromises.delete(dictType)
      throw err
    })

  loadingPromises.set(dictType, promise)
  return promise
}

/**
 * 字典数据 Hook
 * @param dictType 字典类型标识
 * @param immediate 是否立即加载（默认 true）
 */
export function useDict(dictType: string, immediate = true) {
  const dictData: Ref<DictDataVo[]> = ref([])

  /** 加载字典数据 */
  async function load() {
    dictData.value = await loadDict(dictType)
    return dictData.value
  }

  /** 强制刷新字典数据 */
  async function refresh() {
    dictData.value = await loadDict(dictType, true)
    return dictData.value
  }

  /**
   * 根据字典 value 反查 label
   * @param value 字典值
   * @param fallback 未匹配时的回退值，默认 '-'
   */
  function getDictLabel(value: string | number | undefined | null, fallback = '-'): string {
    if (value === undefined || value === null || value === '') return fallback
    const item = dictData.value.find((d) => String(d.value) === String(value))
    return item?.label ?? fallback
  }

  /**
   * 根据字典 value 反查 listClass（标签样式）
   * @param value 字典值
   */
  function getDictListClass(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return ''
    const item = dictData.value.find((d) => String(d.value) === String(value))
    return item?.listClass ?? ''
  }

  if (immediate) {
    load()
  }

  return {
    dictData,
    load,
    refresh,
    getDictLabel,
    getDictListClass,
  }
}

/**
 * 全局清除前端字典内存缓存
 * @description 用于退出登录或刷新缓存按钮调用
 */
export function clearDictCache() {
  dictCache.clear()
  loadingPromises.clear()
}
