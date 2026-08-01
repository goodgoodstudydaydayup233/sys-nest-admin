/**
 * 字典管理 API
 * @description 字典类型、字典数据、字段分组接口，按后端 Controller 拆分
 *
 * @接口清单
 * 字典类型 (dictType):
 * - GET    /dict-type               获取字典类型列表（分页 + 筛选）
 * - GET    /dict-type/refresh       刷新字典缓存
 * - GET    /dict-type/{id}          获取字典类型详情
 * - POST   /dict-type               创建字典类型
 * - PUT    /dict-type/{id}          更新字典类型
 * - DELETE /dict-type/batch         删除字典类型
 * - DELETE /dict-type/{id}          删除字典类型
 *
 * 字典数据 (dictData):
 * - GET    /dict-data               获取字典数据列表（分页 + 筛选）
 * - GET    /dict-data/type/{type}   根据字典类型获取字典数据
 * - GET    /dict-data/{id}          获取字典数据详情
 * - POST   /dict-data               创建字典数据
 * - PUT    /dict-data/{id}          更新字典数据
 * - DELETE /dict-data/batch         删除字典数据
 * - DELETE /dict-data/{id}          删除字典数据
 *
 * 字段分组 (fieldGroup):
 * - GET    /field-group             获取分组列表（分页 + 筛选）
 * - GET    /field-group/all         获取全部启用分组
 * - GET    /field-group/{id}        获取分组详情
 * - POST   /field-group             创建分组
 * - PUT    /field-group/{id}        更新分组
 * - DELETE /field-group/batch       删除分组
 * - DELETE /field-group/{id}        删除分组
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 字典类型视图对象 */
export interface DictTypeVo {
  id: number | string
  name: string
  type: string
  groupId?: number
  groupName?: string
  sort: number
  status: string
  remark?: string
}

/** 字典类型列表响应 */
export type DictTypeListVo = PaginationResult<DictTypeVo>

/** 字典类型查询参数 */
export interface QueryDictTypeParams extends PageParams {
  name?: string
  type?: string
  groupId?: number
  status?: string
}

/** 创建字典类型参数 */
export interface CreateDictTypeParams {
  name: string
  type: string
  groupId?: number
  sort?: number
  status?: string
  remark?: string
}

/** 更新字典类型参数（全部可选） */
export type UpdateDictTypeParams = Partial<CreateDictTypeParams>

// ==================== 字典数据类型 ====================

/** 字典数据视图对象 */
export interface DictDataVo {
  id: number | string
  label: string
  value: string
  typeId: number
  cssClass?: string
  listClass?: string
  sort: number
  status: string
  remark?: string
}

/** 字典数据列表响应 */
export type DictDataListVo = PaginationResult<DictDataVo>

/** 字典数据查询参数 */
export interface QueryDictDataParams extends PageParams {
  label?: string
  typeId?: number
  dictType?: string
  status?: string
}

/** 创建字典数据参数 */
export interface CreateDictDataParams {
  label: string
  value: string
  typeId: number
  cssClass?: string
  listClass?: string
  sort?: number
  status?: string
  remark?: string
}

/** 更新字典数据参数（全部可选） */
export type UpdateDictDataParams = Partial<CreateDictDataParams>

// ==================== 字段分组类型 ====================

/** 字段分组视图对象 */
export interface FieldGroupVo {
  id: number | string
  name: string
  code: string
  sort: number
  status: string
  remark?: string
}

/** 字段分组列表响应 */
export type FieldGroupListVo = PaginationResult<FieldGroupVo>

/** 字段分组查询参数 */
export interface QueryFieldGroupParams extends PageParams {
  name?: string
  status?: string
}

/** 创建字段分组参数 */
export interface CreateFieldGroupParams {
  name: string
  code: string
  sort?: number
  status?: string
  remark?: string
}

/** 更新字段分组参数（全部可选） */
export type UpdateFieldGroupParams = Partial<CreateFieldGroupParams>

// ==================== 批量操作通用类型 ====================

/** 删除参数 */
export interface BatchDeleteParams {
  ids: (number | string)[]
}

// ==================== dictType API ====================

export const dictTypeApi = {
  /** 获取字典类型列表 */
  getDictTypeList(params: QueryDictTypeParams): Promise<DictTypeListVo> {
    return http.get<DictTypeListVo>({
      url: '/dict-type',
      params,
    })
  },

  /** 刷新字典缓存（清空并重新预加载） */
  refreshCache(): Promise<{ count: number }> {
    return http.get<{ count: number }>({
      url: '/dict-type/refresh',
    })
  },

  /** 获取字典类型详情 */
  getDictTypeDetail(id: number | string): Promise<DictTypeVo> {
    return http.get<DictTypeVo>({
      url: `/dict-type/${id}`,
    })
  },

  /** 创建字典类型 */
  createDictType(data: CreateDictTypeParams): Promise<void> {
    return http.post<void>({
      url: '/dict-type',
      data,
    })
  },

  /** 更新字典类型 */
  updateDictType(id: number | string, data: UpdateDictTypeParams): Promise<void> {
    return http.put<void>({
      url: `/dict-type/${id}`,
      data,
    })
  },

  /** 删除字典类型 */
  batchRemoveDictType(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({
      url: '/dict-type/batch',
      data,
    })
  },

  /** 删除字典类型 */
  removeDictType(id: number | string): Promise<void> {
    return http.delete<void>({
      url: `/dict-type/${id}`,
    })
  },
}

// ==================== dictData API ====================

export const dictDataApi = {
  /** 获取字典数据列表 */
  getDictDataList(params: QueryDictDataParams): Promise<DictDataListVo> {
    return http.get<DictDataListVo>({
      url: '/dict-data',
      params,
    })
  },

  /** 根据字典类型获取字典数据 */
  getDictDataByType(dictType: string): Promise<DictDataVo[]> {
    return http.get<DictDataVo[]>({
      url: `/dict-data/type/${dictType}`,
    })
  },

  /** 获取字典数据详情 */
  getDictDataDetail(id: number | string): Promise<DictDataVo> {
    return http.get<DictDataVo>({
      url: `/dict-data/${id}`,
    })
  },

  /** 创建字典数据 */
  createDictData(data: CreateDictDataParams): Promise<void> {
    return http.post<void>({
      url: '/dict-data',
      data,
    })
  },

  /** 更新字典数据 */
  updateDictData(id: number | string, data: UpdateDictDataParams): Promise<void> {
    return http.put<void>({
      url: `/dict-data/${id}`,
      data,
    })
  },

  /** 删除字典数据 */
  batchRemoveDictData(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({
      url: '/dict-data/batch',
      data,
    })
  },

  /** 删除字典数据 */
  removeDictData(id: number | string): Promise<void> {
    return http.delete<void>({
      url: `/dict-data/${id}`,
    })
  },
}

// ==================== fieldGroup API ====================

export const fieldGroupApi = {
  /** 获取字段分组列表 */
  getFieldGroupList(params: QueryFieldGroupParams): Promise<FieldGroupListVo> {
    return http.get<FieldGroupListVo>({
      url: '/field-group',
      params,
    })
  },

  /** 获取全部启用的字段分组 */
  getFieldGroupAll(): Promise<FieldGroupVo[]> {
    return http.get<FieldGroupVo[]>({
      url: '/field-group/all',
    })
  },

  /** 获取字段分组详情 */
  getFieldGroupDetail(id: number | string): Promise<FieldGroupVo> {
    return http.get<FieldGroupVo>({
      url: `/field-group/${id}`,
    })
  },

  /** 创建字段分组 */
  createFieldGroup(data: CreateFieldGroupParams): Promise<void> {
    return http.post<void>({
      url: '/field-group',
      data,
    })
  },

  /** 更新字段分组 */
  updateFieldGroup(id: number | string, data: UpdateFieldGroupParams): Promise<void> {
    return http.put<void>({
      url: `/field-group/${id}`,
      data,
    })
  },

  /** 删除字段分组 */
  batchRemoveFieldGroup(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({
      url: '/field-group/batch',
      data,
    })
  },

  /** 删除字段分组 */
  removeFieldGroup(id: number | string): Promise<void> {
    return http.delete<void>({
      url: `/field-group/${id}`,
    })
  },
}
