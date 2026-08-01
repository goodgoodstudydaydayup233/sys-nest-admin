/**
 * 对象过滤工具
 * @description 提供对象/参数清洗功能，移除无效值
 *
 * @example
 * ```typescript
 * import { filterEmptyFields } from '@/utils/filter'
 *
 * // 清洗查询参数
 * const params = { name: '张三', age: '', address: null, phone: undefined }
 * const clean = filterEmptyFields(params)
 * // { name: '张三' }
 * ```
 */

/**
 * 过滤对象中的空字符串、null、undefined
 * @param obj 待过滤的对象
 * @returns 过滤后的新对象（不修改原对象）
 */
export function filterEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(obj)) {
    const value = obj[key]

    if (value === '' || value === null || value === undefined) {
      continue
    }

    result[key] = value
  }

  return result as Partial<T>
}
