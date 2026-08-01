/**
 * 服务监控 API
 * @description 对标若依 monitor/server 接口，获取服务器 CPU/内存/磁盘/系统/Node.js 运行时信息
 *
 * @接口清单
 * - GET /monitor/server   获取服务监控信息
 *
 * @example 使用示例
 * ```typescript
 * import { serverApi } from '@/api/monitor'
 *
 * const info = await serverApi.getServerInfo()
 * console.log(info.cpu.used)   // CPU 使用率 (%)
 * console.log(info.mem.total)  // 内存总量 (GB)
 * ```
 */

import http from '@/utils/request'

// ==================== 类型定义 ====================

/** CPU 信息 */
export interface CpuVo {
  /** 核心数 */
  cpuNum: number
  /** CPU 总使用率 (%) */
  used: number
  /** 系统使用率 (%) */
  sys: number
  /** 用户使用率 (%) */
  user: number
  /** CPU 型号 */
  model: string
  /** 主频 (GHz) */
  speed: number
}

/** 内存信息 */
export interface MemVo {
  /** 内存总量 (GB) */
  total: number
  /** 已用内存 (GB) */
  used: number
  /** 空闲内存 (GB) */
  free: number
  /** 内存使用率 (%) */
  usage: number
}

/** 系统信息 */
export interface SysVo {
  /** 服务器名称 */
  computerName: string
  /** 服务器 IP */
  computerIp: string
  /** 操作系统 */
  osName: string
  /** 系统架构 */
  osArch: string
  /** 项目路径 */
  userDir: string
  /** 服务器当前时间 */
  sysTime: string
  /** 系统运行时长（秒） */
  uptime: number
}

/** Node.js 运行时信息（兼容若依 JVM 字段） */
export interface NodeRuntimeVo {
  /** Node.js 版本 */
  nodeVersion: string
  /** NestJS 版本 */
  nestVersion: string
  /** 进程运行时长（秒） */
  runTime: number
  /** Node.js 安装路径 */
  home: string
  /** 分配给进程的内存总量 (GB) */
  totalMemory: number
  /** 进程已用内存 (GB) */
  usedMemory: number
  /** 进程空闲内存 (GB) */
  freeMemory: number
  /** 进程最大可用内存 (GB) */
  maxMemory: number
}

/** 磁盘信息 */
export interface DiskVo {
  /** 盘符/挂载点 */
  dirName: string
  /** 文件系统类型 */
  sysTypeName: string
  /** 磁盘类型 */
  typeName: string
  /** 磁盘总量 (GB) */
  total: number
  /** 已用 (GB) */
  used: number
  /** 空闲 (GB) */
  free: number
  /** 使用率 (%) */
  usage: number
}

/** 服务监控聚合信息 */
export interface ServerVo {
  /** CPU 信息 */
  cpu: CpuVo
  /** 内存信息 */
  mem: MemVo
  /** 系统信息 */
  sys: SysVo
  /** Node.js 运行时信息 */
  node: NodeRuntimeVo
  /** 进程信息（兼容若依 JVM 字段，同 node） */
  jvm: NodeRuntimeVo
  /** 磁盘信息列表 */
  sysFiles: DiskVo[]
}

// ==================== server API ====================

export const serverApi = {
  /** 获取服务监控信息 */
  getServerInfo(): Promise<ServerVo> {
    return http.get<ServerVo>({ url: '/monitor/server' })
  },
}
