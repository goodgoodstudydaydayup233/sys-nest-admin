/**
 * 菜单管理 API
 * @description 菜单相关接口，按后端 MenuController 拆分
 *
 * @接口清单
 * - GET    /menu              获取菜单列表（平铺，不分页）
 * - GET    /menu/tree         获取菜单树
 * - GET    /menu/{id}         获取菜单详情
 * - POST   /menu              创建菜单
 * - PUT    /menu/{id}         更新菜单
 * - DELETE /menu/{id}         删除菜单
 */

import http from '@/utils/request'

// ==================== 类型定义 ====================

/**
 * 菜单视图对象
 * @description 对应后端 MenuVo（继承 BaseVo：id、createdAt、updatedAt）
 *
 * @example
 * ```typescript
 * const menu: MenuVo = {
 *   id: 1,
 *   menuName: '系统管理',
 *   parentId: 0,
 *   orderNum: 1,
 *   path: 'system',
 *   menuType: 'M',
 *   isFrame: '1',
 *   isCache: '0',
 *   visible: '0',
 *   createdAt: '2025-01-01T00:00:00.000Z',
 *   updatedAt: '2025-01-01T00:00:00.000Z',
 * }
 * ```
 */
export interface MenuVo {
  /** 菜单 ID */
  id: number
  /** 菜单名称 */
  menuName: string
  /** 父菜单 ID */
  parentId: number
  /** 显示顺序 */
  orderNum: number
  /** 路由地址 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 路由参数 */
  query?: string
  /** 是否为外链: 0-是 1-否 */
  isFrame: string
  /** 是否缓存: 0-缓存 1-不缓存 */
  isCache: string
  /** 是否显示: 0-显示 1-隐藏 */
  visible: string
  /** 菜单类型: M-目录 C-菜单 F-按钮 */
  menuType: string
  /** 权限标识 */
  perms?: string
  /** 菜单图标 */
  icon?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 菜单树视图对象
 * @description 对应后端 MenuTreeVo，继承 MenuVo 并扩展 children 字段
 *
 * @example
 * ```typescript
 * const tree: MenuTreeVo[] = await menuApi.getMenuTree()
 * tree.forEach((node) => {
 *   console.log(node.menuName, node.children?.length)
 * })
 * ```
 */
export interface MenuTreeVo extends MenuVo {
  /** 子菜单列表 */
  children?: MenuTreeVo[]
}

/**
 * 角色菜单树查询结果
 * @description 对应后端 roleMenuTreeselect 接口返回结构
 *
 * @example
 * ```typescript
 * const result: RoleMenuTreeselectResult = {
 *   menus: [{ id: 1, label: '系统管理', children: [...] }],
 *   checkedKeys: [2, 3, 4],
 * }
 * ```
 */
export interface RoleMenuTreeselectResult {
  /** 菜单树（el-tree 数据源格式） */
  menus: MenuTreeVo[]
  /** 当前角色已勾选的菜单 ID 列表 */
  checkedKeys: number[]
}

/**
 * 菜单查询参数
 * @description 对应后端 QueryMenuDto（非分页查询）
 *
 * @example
 * ```typescript
 * const list = await menuApi.getMenuList({ menuName: '用户', visible: '0' })
 * ```
 */
export interface QueryMenuParams {
  /** 菜单名称 */
  menuName?: string
  /** 是否显示: 0-显示 1-隐藏 */
  visible?: string
}

/**
 * 创建菜单参数
 * @description 对应后端 CreateMenuDto
 *
 * @example
 * ```typescript
 * await menuApi.createMenu({
 *   menuName: '用户管理',
 *   parentId: 1,
 *   orderNum: 1,
 *   path: 'user',
 *   component: 'system/user/index',
 *   menuType: 'C',
 *   icon: 'User',
 * })
 * ```
 */
export interface CreateMenuParams {
  /** 菜单名称（必填） */
  menuName: string
  /** 父菜单 ID */
  parentId?: number
  /** 显示顺序 */
  orderNum?: number
  /** 路由地址 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 路由参数 */
  query?: string
  /** 是否为外链: 0-是 1-否 */
  isFrame?: string
  /** 是否缓存: 0-缓存 1-不缓存 */
  isCache?: string
  /** 是否显示: 0-显示 1-隐藏 */
  visible?: string
  /** 菜单类型: M-目录 C-菜单 F-按钮 */
  menuType?: string
  /** 权限标识 */
  perms?: string
  /** 菜单图标 */
  icon?: string
}

/**
 * 更新菜单参数
 * @description 对应后端 UpdateMenuDto（PartialType of CreateMenuDto）
 *
 * @example
 * ```typescript
 * await menuApi.updateMenu(1, { menuName: '新名称', orderNum: 2 })
 * ```
 */
export interface UpdateMenuParams {
  /** 菜单名称 */
  menuName?: string
  /** 父菜单 ID */
  parentId?: number
  /** 显示顺序 */
  orderNum?: number
  /** 路由地址 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 路由参数 */
  query?: string
  /** 是否为外链: 0-是 1-否 */
  isFrame?: string
  /** 是否缓存: 0-缓存 1-不缓存 */
  isCache?: string
  /** 是否显示: 0-显示 1-隐藏 */
  visible?: string
  /** 菜单类型: M-目录 C-菜单 F-按钮 */
  menuType?: string
  /** 权限标识 */
  perms?: string
  /** 菜单图标 */
  icon?: string
}

// ==================== API 接口定义 ====================

export const menuApi = {
  /**
   * 获取菜单列表
   * @description GET /menu，返回平铺数组（不分页）
   * @param params 查询参数（菜单名称、显示状态）
   * @returns 菜单平铺列表（已解包 data）
   *
   * @example
   * ```typescript
   * const list = await menuApi.getMenuList()
   * console.log('共', list.length, '个菜单')
   * ```
   */
  getMenuList(params?: QueryMenuParams): Promise<MenuVo[]> {
    return http.get<MenuVo[]>({
      url: '/menu',
      params,
    })
  },

  /**
   * 获取菜单树
   * @description GET /menu/tree，返回树形结构数据
   * @returns 菜单树形列表（已解包 data）
   *
   * @example
   * ```typescript
   * const tree = await menuApi.getMenuTree()
   * // 用于树形选择器、侧边栏渲染等场景
   * ```
   */
  getMenuTree(): Promise<MenuTreeVo[]> {
    return http.get<MenuTreeVo[]>({
      url: '/menu/tree',
    })
  },

  /**
   * 获取角色菜单树（含勾选状态）
   * @description GET /menu/roleMenuTreeselect/{roleId}
   * @param roleId 角色 ID
   * @returns 菜单树 + 当前角色已勾选的菜单 ID 列表
   *
   * @example
   * ```typescript
   * const { menus, checkedKeys } = await menuApi.getRoleMenuTreeselect(1)
   * menuTreeData.value = menus
   * checkedKeys.forEach((id) => treeRef.value.setChecked(id, true, false))
   * ```
   */
  getRoleMenuTreeselect(roleId: number | string): Promise<RoleMenuTreeselectResult> {
    return http.get<RoleMenuTreeselectResult>({
      url: `/menu/roleMenuTreeselect/${roleId}`,
    })
  },

  /**
   * 获取菜单详情
   * @description GET /menu/{id}
   * @param menuId 菜单 ID
   * @returns 菜单完整信息（已解包 data）
   *
   * @example
   * ```typescript
   * const menu = await menuApi.getMenuDetail(1)
   * console.log(menu.menuName, menu.children)
   * ```
   */
  getMenuDetail(menuId: number | string): Promise<MenuVo> {
    return http.get<MenuVo>({
      url: `/menu/${menuId}`,
    })
  },

  /**
   * 创建菜单
   * @description POST /menu
   * @param data 创建参数（menuName 必填）
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await menuApi.createMenu({
   *   menuName: '用户管理',
   *   parentId: 0,
   *   path: 'user',
   *   component: 'system/user/index',
   *   menuType: 'C',
   * })
   * // 创建成功
   * ```
   */
  createMenu(data: CreateMenuParams): Promise<void> {
    return http.post<void>({
      url: '/menu',
      data,
    })
  },

  /**
   * 更新菜单
   * @description PUT /menu/{id}
   * @param menuId 菜单 ID
   * @param data 修改参数
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await menuApi.updateMenu(1, { menuName: '新名称', orderNum: 2 })
   * // 修改成功
   * ```
   */
  updateMenu(menuId: number | string, data: UpdateMenuParams): Promise<void> {
    return http.put<void>({
      url: `/menu/${menuId}`,
      data,
    })
  },

  /**
   * 删除菜单
   * @description DELETE /menu/{id}
   * @param menuId 菜单 ID
   * @returns 后端返回 code: 200 则成功，否则拦截器自动抛出异常并提示错误
   *
   * @example
   * ```typescript
   * await menuApi.deleteMenu(1)
   * // 删除成功
   * ```
   */
  deleteMenu(menuId: number | string): Promise<void> {
    return http.delete<void>({
      url: `/menu/${menuId}`,
    })
  },
}

export default menuApi
