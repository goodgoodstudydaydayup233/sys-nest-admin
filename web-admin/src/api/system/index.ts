/**
 * 系统管理模块 API 聚合导出
 * @description
 * 所有系统管理子模块统一从此处导出
 * 后续新增模块（角色、菜单、字典等）在此处扩展即可
 *
 * @example 使用示例
 * ```typescript
 * import { authApi, userApi, roleApi, menuApi } from '@/api/system'
 *
 * // 认证相关
 * await authApi.login({ username: 'admin', password: '123456' })
 * await authApi.logout()
 * const user = await authApi.getUserInfo()
 *
 * // 用户管理
 * const { list, total } = await userApi.getUserList({ page: 1, pageSize: 10 })
 * const detail = await userApi.getUserDetail(1)
 * await userApi.updateUser(1, { nickname: '新昵称', roleIds: [1, 2] })
 * await userApi.deleteUser(1)
 *
 * // 角色管理
 * const roleList = await roleApi.getRoleList({ page: 1, pageSize: 10 })
 * await roleApi.createRole({ name: '管理员', code: 'admin' })
 * await roleApi.updateRole(1, { name: '新名称' })
 * await roleApi.deleteRole(1)
 *
 * // 菜单管理
 * const menuList = await menuApi.getMenuList()
 * const menuTree = await menuApi.getMenuTree()
 * await menuApi.createMenu({ menuName: '用户管理', parentId: 0, path: 'user' })
 * await menuApi.updateMenu(1, { menuName: '新名称' })
 * await menuApi.deleteMenu(1)
 *
 * // 字典类型管理
 * const { list, total } = await dictTypeApi.getDictTypeList({ page: 1, pageSize: 10 })
 * await dictTypeApi.createDictType({ name: '性别', type: 'sex' })
 * await dictTypeApi.updateDictType(1, { name: '新名称' })
 *
 * // 字典数据管理
 * const dictList = await dictDataApi.getDictDataByType('sex')
 * await dictDataApi.createDictData({ label: '男', value: '0', typeId: 1 })
 * await dictDataApi.updateDictData(1, { label: '男性' })
 *
 * // 字段分组管理
 * const groupAll = await fieldGroupApi.getFieldGroupAll()
 * await fieldGroupApi.createFieldGroup({ name: '基础信息', code: 'base' })
 * ```
 */

// ==================== 认证模块 ====================

export { authApi } from './auth'
export type {
  LoginParams,
  LoginResult,
  TokenPair,
  CaptchaResult,
  UserInfo,
  RouterInfo,
} from './auth'

// ==================== 用户管理模块 ====================

export { userApi } from './user'
export type {
  UserVo,
  RoleVo,
  QueryUserParams,
  CreateUserParams,
  UpdateUserParams,
  UpdateProfileParams,
  ChangeOwnPasswordParams,
} from './user'

// ==================== 角色管理模块 ====================

export { roleApi } from './role'
export type {
  RoleVo as RoleDetailVo,
  MenuVo as RoleMenuVo,
  QueryRoleParams,
  CreateRoleParams,
  UpdateRoleParams,
} from './role'

// ==================== 菜单管理模块 ====================

export { menuApi } from './menu'
export type {
  MenuVo,
  MenuTreeVo,
  QueryMenuParams,
  CreateMenuParams,
  UpdateMenuParams,
  RoleMenuTreeselectResult,
} from './menu'

// ==================== 参数配置模块 ====================

export { configApi } from './config'
export type {
  ConfigVo,
  ConfigListVo,
  QueryConfigParams,
  CreateConfigParams,
  UpdateConfigParams,
} from './config'

// ==================== 通知公告模块 ====================

export { noticeApi } from './notice'
export type {
  NoticeVo,
  NoticeListVo,
  QueryNoticeParams,
  CreateNoticeParams,
  UpdateNoticeParams,
} from './notice'

// ==================== 字典管理模块 ====================

export { dictTypeApi, dictDataApi, fieldGroupApi } from './dict'
export type {
  DictTypeVo,
  DictTypeListVo,
  QueryDictTypeParams,
  CreateDictTypeParams,
  UpdateDictTypeParams,
  DictDataVo,
  DictDataListVo,
  QueryDictDataParams,
  CreateDictDataParams,
  UpdateDictDataParams,
  FieldGroupVo,
  FieldGroupListVo,
  QueryFieldGroupParams,
  CreateFieldGroupParams,
  UpdateFieldGroupParams,
  BatchDeleteParams,
} from './dict'

// ==================== 兼容旧调用方式 ====================

import { authApi } from './auth'
import { userApi } from './user'

/** @deprecated 请使用 authApi 替代 */
export { authApi as systemAuthApi }

/** @deprecated 请使用 userApi 替代 */
export const systemApi = {
  ...userApi,
}
