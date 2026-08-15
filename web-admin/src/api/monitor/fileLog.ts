/**
 * 文件日志 API
 * @description 对应后端 FileLogController 接口
 *
 * @接口清单
 * - GET    /file-log/files      获取日志文件列表（按分类，分页）
 * - GET    /file-log/entries    查询日志内容（分类/级别/时间/关键字筛选 + 分页）
 * - GET    /file-log/download   下载单个日志文件
 * - DELETE /file-log/file       删除单个日志文件
 */

import http from '@/utils/request'
import type { AxiosResponse } from 'axios'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 日志分类 */
export type LogCategory = 'access' | 'app' | 'error'

/** 日志级别 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'VERBOSE'

/** 日志文件视图对象 */
export interface FileLogFileVo {
  /** 文件名，如 access-20260815-0001.log */
  name: string
  /** 日志分类 */
  category: LogCategory
  /** 文件大小（字节） */
  size: number
  /** 文件大小（人性化展示） */
  sizeText: string
  /** 最后修改时间 */
  mtime: string
}

/** 日志文件列表响应 */
export interface FileLogFilesVo extends PaginationResult<FileLogFileVo> {
  page: number
  pageSize: number
  /** 分类下全部文件总大小（字节） */
  totalSize: number
  /** 分类下全部文件总大小（人性化展示） */
  totalSizeText: string
  /** 分类下文件总数 */
  totalFiles: number
}

/** 单条日志内容 */
export interface FileLogEntryVo {
  /** 日志时间 */
  ts: string
  /** 日志级别 */
  level: LogLevel
  /** 日志分类 */
  category: LogCategory
  /** 日志摘要 */
  message: string
  /** 应用日志上下文 */
  context?: string
  /** 异常堆栈 */
  stack?: string
  /** 请求方式（仅访问日志） */
  method?: string
  /** 请求路径（仅访问日志） */
  url?: string
  /** HTTP 状态码（仅访问日志） */
  status?: number
  /** 客户端 IP（仅访问日志） */
  ip?: string
  /** 操作人用户名（仅访问日志） */
  user?: string
  /** 请求耗时（毫秒，仅访问日志） */
  cost?: number
  /** User-Agent（仅访问日志） */
  ua?: string
}

/** 日志内容分页响应 */
export interface FileLogEntriesVo extends PaginationResult<FileLogEntryVo> {
  page: number
  pageSize: number
  /** 是否因扫描行数达到上限被截断 */
  truncated?: boolean
}

/** 日志文件原始内容分页响应（在线预览） */
export interface FileLogRawVo {
  /** 当前页原始文本行（不含换行符） */
  content: string[]
  /** 文件总行数（达到读取上限时为截断行数） */
  total: number
  /** 页码 */
  page: number
  /** 每页行数 */
  pageSize: number
  /** 是否因文件过大只读取了部分行 */
  truncated?: boolean
}

/** 日志文件列表查询参数 */
export interface QueryFileLogFilesParams extends PageParams {
  category: LogCategory
}

/** 日志内容查询参数 */
export interface QueryFileLogEntriesParams extends PageParams {
  category: LogCategory
  level?: LogLevel
  keyword?: string
  startTime?: string
  endTime?: string
  /** 指定日志文件名（精确查看单个文件时使用） */
  fileName?: string
}

// ==================== fileLog API ====================

export const fileLogApi = {
  /** 获取日志文件列表 */
  getFiles(params: QueryFileLogFilesParams): Promise<FileLogFilesVo> {
    return http.get<FileLogFilesVo>({ url: '/file-log/files', params })
  },

  /** 查询日志内容 */
  getEntries(params: QueryFileLogEntriesParams): Promise<FileLogEntriesVo> {
    return http.get<FileLogEntriesVo>({ url: '/file-log/entries', params })
  },

  /** 预览日志文件原始内容（按行分页） */
  getRaw(params: { fileName: string; page?: number; pageSize?: number }): Promise<FileLogRawVo> {
    return http.get<FileLogRawVo>({ url: '/file-log/raw', params })
  },

  /** 下载单个日志文件 */
  async downloadFile(name: string): Promise<void> {
    // blob 场景下 http.download 返回原始 AxiosResponse，data 为 Blob
    const response = await http.download<AxiosResponse<Blob>>({
      url: '/file-log/download',
      params: { name },
      preventDuplicate: false,
    })
    const blob = response.data
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    window.URL.revokeObjectURL(url)
  },

  /** 删除单个日志文件 */
  removeFile(data: { name: string }): Promise<void> {
    return http.delete<void>({ url: '/file-log/file', data })
  },
}
