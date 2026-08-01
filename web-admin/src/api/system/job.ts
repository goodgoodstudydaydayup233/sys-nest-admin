/**
 * 定时任务管理 API
 * @description 定时任务、调度日志接口，按后端 Controller 拆分
 *
 * @接口清单
 * 定时任务 (job):
 * - GET    /job               获取任务列表（分页 + 筛选）
 * - GET    /job/{id}          获取任务详情
 * - POST   /job               创建任务
 * - PUT    /job/{id}          更新任务
 * - PUT    /job/changeStatus  修改任务状态（启用/暂停）
 * - PUT    /job/run           立即执行一次
 * - DELETE /job/batch         批量删除任务
 * - DELETE /job/{id}          删除任务
 *
 * 调度日志 (jobLog):
 * - GET    /job-log           获取日志列表（分页 + 筛选）
 * - GET    /job-log/{id}      获取日志详情
 * - DELETE /job-log           批量删除日志（body: { ids: number[] }）
 * - DELETE /job-log/clean     清空所有日志
 */

import http from '@/utils/request'
import type { PageParams, PaginationResult } from '@/types'

// ==================== 类型定义 ====================

/** 定时任务视图对象 */
export interface JobVo {
  jobId: number | string
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  /** 计划执行错误策略: 1-立即执行 2-执行一次 3-放弃执行 */
  misfirePolicy: string
  /** 是否并发执行: 0-允许 1-禁止 */
  concurrent: string
  /** 状态: 0-正常 1-暂停 */
  status: string
  /** 下次执行时间 */
  nextValidTime?: string | null
  remark?: string
  createdAt?: string
  updatedAt?: string
}

/** 定时任务列表响应 */
export type JobListVo = PaginationResult<JobVo>

/** 定时任务查询参数 */
export interface QueryJobParams extends PageParams {
  jobName?: string
  jobGroup?: string
  status?: string
}

/** 创建定时任务参数 */
export interface CreateJobParams {
  jobName: string
  jobGroup?: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy?: string
  concurrent?: string
  status?: string
  remark?: string
}

/** 更新定时任务参数（全部可选） */
export type UpdateJobParams = Partial<CreateJobParams>

/** 修改任务状态参数 */
export interface ChangeJobStatusParams {
  jobId: number | string
  status: string
}

// ==================== 调度日志类型 ====================

/** 调度日志视图对象 */
export interface JobLogVo {
  jobLogId: number | string
  jobName: string
  jobGroup: string
  invokeTarget: string
  jobMessage?: string
  /** 执行状态: 0-成功 1-失败 */
  status: string
  exceptionInfo?: string | null
  createTime: string
}

/** 调度日志列表响应 */
export type JobLogListVo = PaginationResult<JobLogVo>

/** 调度日志查询参数 */
export interface QueryJobLogParams extends PageParams {
  jobName?: string
  jobGroup?: string
  status?: string
  beginTime?: string
  endTime?: string
}

// ==================== 批量操作通用类型 ====================

/** 批量删除参数 */
export interface BatchDeleteParams {
  ids: (number | string)[]
}

// ==================== job API ====================

export const jobApi = {
  /** 获取定时任务列表 */
  getJobList(params: QueryJobParams): Promise<JobListVo> {
    return http.get<JobListVo>({ url: '/job', params })
  },

  /** 获取定时任务详情 */
  getJobDetail(id: number | string): Promise<JobVo> {
    return http.get<JobVo>({ url: `/job/${id}` })
  },

  /** 创建定时任务 */
  createJob(data: CreateJobParams): Promise<void> {
    return http.post<void>({ url: '/job', data })
  },

  /** 更新定时任务 */
  updateJob(id: number | string, data: UpdateJobParams): Promise<void> {
    return http.put<void>({ url: `/job/${id}`, data })
  },

  /** 修改定时任务状态（启用/暂停） */
  changeJobStatus(data: ChangeJobStatusParams): Promise<void> {
    return http.put<void>({ url: '/job/changeStatus', data })
  },

  /** 立即执行一次定时任务 */
  runJob(jobId: number | string): Promise<void> {
    return http.put<void>({ url: '/job/run', data: { jobId } })
  },

  /** 批量删除定时任务 */
  batchRemoveJob(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({ url: '/job/batch', data })
  },

  /** 删除定时任务 */
  removeJob(id: number | string): Promise<void> {
    return http.delete<void>({ url: `/job/${id}` })
  },
}

// ==================== jobLog API ====================

export const jobLogApi = {
  /** 获取调度日志列表 */
  getJobLogList(params: QueryJobLogParams): Promise<JobLogListVo> {
    return http.get<JobLogListVo>({ url: '/job-log', params })
  },

  /** 获取调度日志详情 */
  getJobLogDetail(id: number | string): Promise<JobLogVo> {
    return http.get<JobLogVo>({ url: `/job-log/${id}` })
  },

  /** 批量删除调度日志 */
  batchRemoveJobLog(data: BatchDeleteParams): Promise<void> {
    return http.delete<void>({ url: '/job-log', data })
  },

  /** 清空所有调度日志 */
  cleanJobLog(): Promise<void> {
    return http.delete<void>({ url: '/job-log/clean' })
  },
}
