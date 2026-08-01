/**
 * 角色管理 API
 * @description 角色相关接口，按后端 RoleController 拆分
 *
 * @接口清单
 * - GET    /role              获取角色列表（分页 + 筛选）
 * - GET    /role/{id}         获取角色详情
 * - POST   /role              创建角色
 * - PUT    /role/{id}         更新角色
 * - DELETE /role/{id}         删除角色
 * - DELETE /role/batch        删除角色
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/**
 * 菜单视图对象
 * @description 对应后端 MenuVo（角色详情中携带的菜单信息）
 */
export interface MenuVo {
  /** 菜单 ID */
  id: number
  /** 菜单名称 */
  name: string
  /** 权限标识 */
  permission?: string
}

/**
 * 角色视图对象
 * @description 对应后端 RoleVo（继承 BaseVo：id、createdAt、updatedAt）
 *
 * @example
 * ```typescript
 * const role: RoleVo = {
 *   id: 1,
 *   name: '超级管理员',
 *   code: 'super_admin',
 *   status: '1',
 *   createdAt: '2025-01-01T00:00:00.000Z',
 *   updatedAt: '2025-01-01T00:00:00.000Z',
 * }
 * ```
 */
export interface RoleVo {
  /** 角色 ID */
  id: number
  /** 角色名称 */
  name: string
  /** 角色编码 */
  code: string
  /** 权限标识 */
  permission?: string
  /** 状态: 0-禁用 1-启用 */
  status: string
  /** 排序 */
  sort?: number
  /** 备注 */
  remark?: string
  /** 关联菜单列表 */
  menus?: MenuVo[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 角色查询参数
 * @description 对应后端 QueryRoleDto（继承 BasePaginationDto）
 *
 * @example
 * ```typescript
 * const params: QueryRoleParams = { page: 1, pageSize: 10, name: '管理' }
 * ```
 */
export interface QueryRoleParams extends PageParams {
  /** 角色名称 */
  name?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
}

/**
 * 创建角色参数
 * @description 对应后端 CreateRoleDto
 *
 * @example
 * ```typescript
 * await roleApi.createRole({
 *   name: '普通管理员',
 *   code: 'admin',
 *   status: '1',
 *   menuIds: [1, 2, 3],
 * })
 * ```
 */
export interface CreateRoleParams {
  /** 角色名称（必填） */
  name: string
  /** 角色编码（必填） */
  code: string
  /** 权限标识 */
  permission?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
  /** 排序 */
  sort?: number
  /** 备注 */
  remark?: string
  /** 关联菜单 ID 列表 */
  menuIds?: number[]
}

/**
 * 更新角色参数
 * @description 对应后端 UpdateRoleDto（PartialType of CreateRoleDto）
 *
 * @example
 * ```typescript
 * await roleApi.updateRole(1, { name: '新名称', menuIds: [1, 2] })
 * ```
 */
export interface UpdateRoleParams {
  /** 角色名称 */
  name?: string
  /** 角色编码 */
  code?: string
  /** 权限标识 */
  permission?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
  /** 排序 */
  sort?: number
  /** 备注 */
  remark?: string
  /** 关联菜单 ID 列表 */
  menuIds?: number[]
}

// ==================== API 接口定义 ====================

export const roleApi = {
  /**
   * 获取角色列表
   * @description GET /role
   * @param params 查询参数（含分页和筛选条件）
   * @returns 角色分页数据（已解包 data，直接使用 list 和 total）
   *
   * @example
   * ```typescript
   * const { list, total } = await roleApi.getRoleList({ page: 1, pageSize: 10 })
   * console.log('共', total, '个角色')
   * ```
   */
  getRoleList(params: QueryRoleParams): Promise<PaginationResult<RoleVo>> {
    return http.get<PaginationResult<RoleVo>>({
      url: '/role',
      params,
    })
  },

  /**
   * 获取全部角色（不分页）
   * @description GET /role/all，用于下拉选择等需要全量角色的场景
   * @returns 角色列表（已解包 data）
   *
   * @example
   * ```typescript
   * const roles = await roleApi.getAllRoles()
   * roles.forEach(r => console.log(r.name))
   * ```
   */
  getAllRoles(): Promise<RoleVo[]> {
    return http.get<RoleVo[]>({
      url: '/role/all',
    })
  },

  /**
   * 获取角色详情
   * @description GET /role/{id}
   * @param roleId 角色 ID
   * @returns 角色完整信息（已解包 data）
   *
   * @example
   * ```typescript
   * const role = await roleApi.getRoleDetail(1)
   * console.log(role.name, role.menus)
   * ```
   */
  getRoleDetail(roleId: number | string): Promise<RoleVo> {
    return http.get<RoleVo>({
      url: `/role/${roleId}`,
    })
  },

  /**
   * 创建角色
   * @description POST /role
   * @param data 创建参数（name 和 code 必填）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await roleApi.createRole({
   *   name: '普通管理员',
   *   code: 'admin',
   *   status: '1',
   *   menuIds: [1, 2, 3],
   * })
   * // 创建成功
   * ```
   */
  createRole(data: CreateRoleParams): Promise<void> {
    return http.post<void>({
      url: '/role',
      data,
    })
  },

  /**
   * 更新角色
   * @description PUT /role/{id}
   * @param roleId 角色 ID
   * @param data 修改参数
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await roleApi.updateRole(1, { name: '新名称', menuIds: [1, 2] })
   * // 修改成功
   * ```
   */
  updateRole(roleId: number | string, data: UpdateRoleParams): Promise<void> {
    return http.put<void>({
      url: `/role/${roleId}`,
      data,
    })
  },

  /**
   * 删除角色
   * @description DELETE /role/{id}
   * @param roleId 角色 ID
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await roleApi.deleteRole(1)
   * // 删除成功
   * ```
   */
  deleteRole(roleId: number | string): Promise<void> {
    return http.delete<void>({
      url: `/role/${roleId}`,
    })
  },

  /**
   * 删除角色
   * @description DELETE /role/batch
   * @param ids 角色 ID 数组
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await roleApi.batchDeleteRoles([1, 2, 3])
   * // 删除成功
   * ```
   */
  batchDeleteRoles(ids: number[]): Promise<void> {
    return http.delete<void>({
      url: '/role/batch',
      data: { ids },
    })
  },
}

export default roleApi
