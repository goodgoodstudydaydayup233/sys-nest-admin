/**
 * v-permissions 权限指令
 * @description 校验用户是否拥有指定权限，无权限时移除元素（隐藏按钮）
 *
 * @example 单个权限
 * ```vue
 * <el-button v-permissions="'system:dept:add'">新增</el-button>
 * ```
 *
 * @example 多个权限（满足其一即显示）
 * ```vue
 * <el-button v-permissions="['system:dept:add', 'system:dept:edit']">操作</el-button>
 * ```
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import config from '@/config'

/**
 * 检查是否拥有指定权限
 * @param value 权限字符串或权限字符串数组
 * @returns 是否拥有权限
 */
function checkPermissions(value: string | string[]): boolean {
  const userStore = useUserStore()

  if (userStore.username === config.superAdmin) return true

  const permissions = userStore.permissions

  if (!permissions.length) return false

  if (typeof value === 'string') {
    return permissions.includes(value)
  }

  if (Array.isArray(value)) {
    return value.some((item) => permissions.includes(item))
  }

  return false
}

export const permissions: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding
    if (!value) return

    if (!checkPermissions(value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
