import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CPU 信息视图
 */
export class CpuVo {
  @ApiProperty({ description: '核心数' })
  cpuNum: number;

  @ApiProperty({ description: 'CPU 总使用率 (%)' })
  used: number;

  @ApiProperty({ description: '系统使用率 (%)' })
  sys: number;

  @ApiProperty({ description: '用户使用率 (%)' })
  user: number;

  @ApiProperty({ description: 'CPU 型号' })
  model: string;

  @ApiProperty({ description: '主频 (GHz)' })
  speed: number;
}

/**
 * 内存信息视图
 */
export class MemVo {
  @ApiProperty({ description: '内存总量 (GB)' })
  total: number;

  @ApiProperty({ description: '已用内存 (GB)' })
  used: number;

  @ApiProperty({ description: '空闲内存 (GB)' })
  free: number;

  @ApiProperty({ description: '内存使用率 (%)' })
  usage: number;
}

/**
 * 服务器系统信息视图
 */
export class SysVo {
  @ApiProperty({ description: '服务器名称' })
  computerName: string;

  @ApiProperty({ description: '服务器 IP' })
  computerIp: string;

  @ApiProperty({ description: '操作系统' })
  osName: string;

  @ApiProperty({ description: '系统架构' })
  osArch: string;

  @ApiProperty({ description: '项目路径' })
  userDir: string;

  @ApiProperty({ description: '服务器当前时间' })
  sysTime: string;

  @ApiProperty({ description: '系统运行时长（秒）' })
  uptime: number;
}

/**
 * Node.js 运行时信息视图
 */
export class NodeRuntimeVo {
  @ApiProperty({ description: 'Node.js 版本' })
  nodeVersion: string;

  @ApiProperty({ description: 'NestJS 版本' })
  nestVersion: string;

  @ApiProperty({ description: '进程运行时长（秒）' })
  runTime: number;

  @ApiProperty({ description: 'Node.js 安装路径' })
  home: string;

  @ApiProperty({ description: '分配给进程的内存总量 (GB)' })
  totalMemory: number;

  @ApiProperty({ description: '进程已用内存 (GB)' })
  usedMemory: number;

  @ApiProperty({ description: '进程空闲内存 (GB)' })
  freeMemory: number;

  @ApiPropertyOptional({ description: '进程最大可用内存 (GB)' })
  maxMemory: number;
}

/**
 * 磁盘信息视图
 */
export class DiskVo {
  @ApiProperty({ description: '盘符/挂载点' })
  dirName: string;

  @ApiProperty({ description: '文件系统类型' })
  sysTypeName: string;

  @ApiProperty({ description: '磁盘类型' })
  typeName: string;

  @ApiProperty({ description: '磁盘总量 (GB)' })
  total: number;

  @ApiProperty({ description: '已用 (GB)' })
  used: number;

  @ApiProperty({ description: '空闲 (GB)' })
  free: number;

  @ApiProperty({ description: '使用率 (%)' })
  usage: number;
}

/**
 * 服务监控聚合视图
 */
export class ServerVo {
  @ApiProperty({ description: 'CPU 信息', type: CpuVo })
  cpu: CpuVo;

  @ApiProperty({ description: '内存信息', type: MemVo })
  mem: MemVo;

  @ApiProperty({ description: '系统信息', type: SysVo })
  sys: SysVo;

  @ApiProperty({ description: 'Node.js 运行时信息', type: NodeRuntimeVo })
  node: NodeRuntimeVo;

  @ApiProperty({ description: 'JVM/进程信息', type: NodeRuntimeVo })
  jvm: NodeRuntimeVo;

  @ApiProperty({ description: '磁盘信息', type: [DiskVo] })
  sysFiles: DiskVo[];
}
