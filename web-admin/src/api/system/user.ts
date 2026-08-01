/**
 * 用户管理 API
 * @description 用户相关接口，按后端 Controller 拆分
 *
 * @接口清单
 * - POST   /user                   创建用户（multipart/form-data）
 * - GET    /user                   获取用户列表（分页 + 筛选）
 * - GET    /user/{id}              获取用户详情
 * - PUT    /user/{id}              修改用户信息
 * - PUT    /user/{id}/resetPassword 重置密码
 * - DELETE /user/{id}              删除用户
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/**
 * 角色视图对象
 * @description 对应后端 RoleVo
 */
export interface RoleVo {
  /** 角色 ID */
  id: number | string
  /** 角色名称 */
  name: string
  /** 角色标识 */
  code: string
  /** 备注 */
  remark?: string
}

/**
 * 用户视图对象
 * @description 对应后端 UserVo（继承 BaseVo：id、createdAt、updatedAt）
 *
 * @example
 * ```typescript
 * const user: UserVo = {
 *   id: 1,
 *   username: 'admin',
 *   status: '1',
 *   createdAt: '2025-01-01T00:00:00.000Z',
 *   updatedAt: '2025-01-01T00:00:00.000Z',
 * }
 * ```
 */
export interface UserVo {
  /** 用户 ID */
  id: number
  /** 用户名 */
  username: string
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 */
  avatar?: string
  /** 状态: 0-禁用 1-启用 */
  status: string
  /** 性别: 0-男 1-女 3-未知 */
  sex?: string
  /** 备注 */
  remark?: string
  /** 角色列表 */
  roles?: RoleVo[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 用户查询参数
 * @description 对应后端 QueryUserDto（继承 BasePaginationDto）
 *
 * @example
 * ```typescript
 * const params: QueryUserParams = { page: 1, pageSize: 10, username: 'admin' }
 * ```
 */
export interface QueryUserParams extends PageParams {
  /** 用户名 */
  username?: string
  /** 昵称 */
  nickname?: string
  /** 手机号 */
  phone?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
}

/**
 * 修改用户参数
 * @description 对应后端 UpdateUserFormDto（PUT /user/{id}，multipart/form-data）
 *
 * @example
 * ```typescript
 * const params: UpdateUserParams = {
 *   username: '员馥君',
 *   nickname: '岳蒙',
 *   status: '1',
 *   roleIds: [95, 16],
 *   avatarFile: fileList[0].raw, // 可选，头像文件
 * }
 * ```
 */
export interface UpdateUserParams {
  /** 用户名 */
  username?: string
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
  /** 性别: 0-男 1-女 3-未知 */
  sex?: string
  /** 备注 */
  remark?: string
  /** 关联角色 ID 列表 */
  roleIds?: number[]
  /** 头像文件（multipart/form-data 上传） */
  avatarFile?: File
}

/**
 * 创建用户参数
 * @description 对应后端 CreateUserFormDto（POST /user，multipart/form-data）
 *
 * @example
 * ```typescript
 * const params: CreateUserParams = {
 *   username: '员馥君',
 *   password: '123456',
 *   nickname: '岳蒙',
 *   status: '1',
 *   roleIds: [95, 16],
 *   avatarFile: fileList[0].raw, // 可选，头像文件
 * }
 * ```
 */
export interface CreateUserParams {
  /** 用户名（必填） */
  username: string
  /** 密码（必填，最少 6 位） */
  password: string
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 状态: 0-禁用 1-启用 */
  status?: string
  /** 性别: 0-男 1-女 3-未知 */
  sex?: string
  /** 备注 */
  remark?: string
  /** 关联角色 ID 列表 */
  roleIds?: number[]
  /** 头像文件（multipart/form-data 上传） */
  avatarFile?: File
}

// ==================== API 接口定义 ====================

/**
 * 修改个人信息参数
 * @description 对应后端 UpdateProfileFormDto（PUT /user/profile，multipart/form-data）
 *
 * @example
 * ```typescript
 * const params: UpdateProfileParams = {
 *   nickname: '新昵称',
 *   sex: '0',
 *   avatarFile: fileList[0].raw, // 可选头像文件
 * }
 * ```
 */
export interface UpdateProfileParams {
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 性别: 0-男 1-女 3-未知 */
  sex?: string
  /** 头像文件（multipart/form-data 上传） */
  avatarFile?: File
}

/**
 * 修改自身密码参数
 * @description 对应后端 ChangePasswordDto（PUT /user/password）
 *
 * @example
 * ```typescript
 * const params: ChangeOwnPasswordParams = {
 *   oldPassword: '123456',
 *   newPassword: '654321',
 * }
 * ```
 */
export interface ChangeOwnPasswordParams {
  /** 旧密码 */
  oldPassword: string
  /** 新密码（至少 6 位） */
  newPassword: string
}

export const userApi = {
  /**
   * 创建用户
   * @description POST /user（multipart/form-data，支持头像文件上传）
   * @param data 创建参数（username 和 password 必填，avatarFile 可选）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.createUser({
   *   username: '员馥君',
   *   password: '123456',
   *   nickname: '岳蒙',
   *   roleIds: [95, 16],
   *   avatarFile: fileList[0].raw, // 可选头像文件
   * })
   * // 创建成功
   * ```
   */
  createUser(data: CreateUserParams): Promise<void> {
    const { avatarFile, ...rest } = data
    const formData = new FormData()
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(`${key}[]`, String(item)))
        } else {
          formData.append(key, String(value))
        }
      }
    })
    if (avatarFile) {
      formData.append('avatarFile', avatarFile)
    }
    return http.post<void>({
      url: '/user',
      data: formData,
      isUpload: true,
    })
  },

  /**
   * 获取用户列表
   * @description GET /user
   * @param params 查询参数（含分页和筛选条件）
   * @returns 用户分页数据（已解包 data，直接使用 list 和 total）
   *
   * @example
   * ```typescript
   * const { list, total } = await userApi.getUserList({ page: 1, pageSize: 10 })
   * console.log('共', total, '个用户')
   * ```
   */
  getUserList(params: QueryUserParams): Promise<PaginationResult<UserVo>> {
    return http.get<PaginationResult<UserVo>>({
      url: '/user',
      params,
    })
  },

  /**
   * 获取用户详情
   * @description GET /user/{id}
   * @param userId 用户 ID
   * @returns 用户完整信息（已解包 data）
   *
   * @example
   * ```typescript
   * const user = await userApi.getUserDetail(1)
   * console.log(user.username)
   * ```
   */
  getUserDetail(userId: number | string): Promise<UserVo> {
    return http.get<UserVo>({
      url: `/user/${userId}`,
    })
  },

  /**
   * 修改用户信息
   * @description PUT /user/{id}（multipart/form-data，支持头像文件上传）
   * @param userId 用户 ID
   * @param data 修改参数（包含可选的 avatarFile 头像文件）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.updateUser(1, {
   *   username: '员馥君',
   *   nickname: '岳蒙',
   *   roleIds: [95, 16],
   *   avatarFile: fileList[0].raw, // 可选头像文件
   * })
   * // 修改成功
   * ```
   */
  updateUser(userId: number | string, data: UpdateUserParams): Promise<void> {
    const { avatarFile, ...rest } = data
    const formData = new FormData()
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(`${key}[]`, String(item)))
        } else {
          formData.append(key, String(value))
        }
      }
    })
    if (avatarFile) {
      formData.append('avatarFile', avatarFile)
    }
    return http.put<void>({
      url: `/user/${userId}`,
      data: formData,
      isUpload: true,
    })
  },

  /**
   * 重置用户密码
   * @description PUT /user/{id}/resetPassword，管理员指定新密码
   * @param userId 用户 ID
   * @param newPassword 新密码（至少 6 位）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.resetPassword(1, '123456')
   * // 密码重置成功
   * ```
   */
  resetPassword(userId: number | string, newPassword: string): Promise<void> {
    return http.put<void>({
      url: `/user/${userId}/resetPassword`,
      data: { newPassword },
    })
  },

  /**
   * 删除用户
   * @description DELETE /user/{id}
   * @param userId 用户 ID
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.deleteUser(1)
   * // 删除成功
   * ```
   */
  deleteUser(userId: number | string): Promise<void> {
    return http.delete<void>({
      url: `/user/${userId}`,
    })
  },

  /**
   * 删除用户
   * @description DELETE /user/batch
   * @param ids 用户 ID 数组
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.batchDeleteUsers([1, 2, 3])
   * // 删除成功
   * ```
   */
  batchDeleteUsers(ids: number[]): Promise<void> {
    return http.delete<void>({
      url: '/user/batch',
      data: { ids },
    })
  },

  /**
   * 修改个人信息
   * @description PUT /user/profile（multipart/form-data，支持头像文件上传）
   * @description 当前登录用户修改自身资料，后端通过 JWT Token 识别身份，无需传 userId
   * @param data 修改参数（nickname、email、phone、sex、avatarFile 均可选）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.updateProfile({
   *   nickname: '新昵称',
   *   sex: '0',
   *   avatarFile: fileList[0].raw, // 可选头像文件
   * })
   * ```
   */
  updateProfile(data: UpdateProfileParams): Promise<void> {
    const { avatarFile, ...rest } = data
    const formData = new FormData()
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    if (avatarFile) {
      formData.append('avatarFile', avatarFile)
    }
    return http.put<void>({
      url: '/user/profile',
      data: formData,
      isUpload: true,
    })
  },

  /**
   * 修改自身密码
   * @description PUT /user/password，当前登录用户修改自己的密码
   * @description 后端通过 JWT Token 识别身份，无需传 userId
   * @param data 包含 oldPassword（旧密码）和 newPassword（新密码，至少 6 位）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await userApi.changeOwnPassword({
   *   oldPassword: '123456',
   *   newPassword: '654321',
   * })
   * ```
   */
  changeOwnPassword(data: ChangeOwnPasswordParams): Promise<void> {
    return http.put<void>({
      url: '/user/password',
      data,
    })
  },

  /**
   * 修改自身头像
   * @description PUT /user/avatar（multipart/form-data），当前登录用户仅上传新头像文件
   * @description 后端通过 JWT Token 识别身份，无需传 userId；后端保存文件后直接更新头像 URL
   * @param file 裁剪后的头像文件（File 或 Blob）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * const blob = await cropImage()
   * const file = new File([blob], 'avatar.png', { type: 'image/png' })
   * await userApi.updateAvatar(file)
   * ```
   */
  updateAvatar(file: File | Blob): Promise<void> {
    const formData = new FormData()
    formData.append('avatarFile', file)
    return http.put<void>({
      url: '/user/avatar',
      data: formData,
      isUpload: true,
    })
  },
}

export default userApi
