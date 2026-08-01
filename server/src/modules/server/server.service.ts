import { Injectable, Logger } from '@nestjs/common';
import * as si from 'systeminformation';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { ServerVo, CpuVo, MemVo, SysVo, NodeRuntimeVo, DiskVo } from './vo/server.vo';

const BYTES_PER_GB = 1024 * 1024 * 1024;

/**
 * 服务监控服务
 * @description 基于 systeminformation 采集：
 *
 * - CPU：型号 / 核心数 / 系统与用户使用率 / 主频
 * - 内存：总量 / 已用 / 空闲 / 使用率
 * - 系统：主机名 / IP / 操作系统 / 架构 / 运行时长
 * - Node.js 运行时：版本 / 进程运行时长 / 内存占用（兼容 JVM 字段）
 * - 磁盘：各盘符 / 挂载点的容量与使用率
 *
 * @说明
 * 基于 Node.js 运行时采集；
 * `jvm` 字段复用 NodeRuntimeVo 以兼容前端字段命名。
 */
@Injectable()
export class ServerService {
  private readonly logger = new Logger(ServerService.name);

  /**
   * 获取服务监控信息
   * @example
   * const info = await serverService.getServerInfo();
   * // info.cpu.used -> CPU 使用率 (%)
   */
  async getServerInfo(): Promise<ServerVo> {
    const [cpu, mem, sys, disks] = await Promise.all([
      this.getCpuInfo(),
      this.getMemInfo(),
      this.getSysInfo(),
      this.getDiskInfo(),
    ]);
    const nodeRuntime = this.getNodeRuntimeInfo();

    return {
      cpu,
      mem,
      sys,
      node: nodeRuntime,
      jvm: nodeRuntime,
      sysFiles: disks,
    };
  }

  /**
   * CPU 信息
   * @description currentLoad 需要约 100ms 采样，返回系统/用户使用率
   */
  private async getCpuInfo(): Promise<CpuVo> {
    try {
      const [cpu, load] = await Promise.all([si.cpu(), si.currentLoad()]);
      return {
        cpuNum: cpu.cores,
        used: Number(load.currentLoad.toFixed(2)),
        sys: Number(load.currentLoadSystem.toFixed(2)),
        user: Number(load.currentLoadUser.toFixed(2)),
        model: cpu.brand || cpu.manufacturer,
        speed: Number((cpu.speed || 0).toFixed(2)),
      };
    } catch (e) {
      this.logger.warn(`获取 CPU 信息失败: ${(e as Error).message}`);
      return {
        cpuNum: os.cpus().length,
        used: 0,
        sys: 0,
        user: 0,
        model: os.cpus()[0]?.model || 'unknown',
        speed: 0,
      };
    }
  }

  /**
   * 内存信息
   */
  private async getMemInfo(): Promise<MemVo> {
    try {
      const mem = await si.mem();
      const total = mem.total / BYTES_PER_GB;
      const used = mem.active / BYTES_PER_GB;
      const free = mem.free / BYTES_PER_GB;
      return {
        total: Number(total.toFixed(2)),
        used: Number(used.toFixed(2)),
        free: Number(free.toFixed(2)),
        usage: Number(((used / total) * 100).toFixed(2)),
      };
    } catch (e) {
      this.logger.warn(`获取内存信息失败: ${(e as Error).message}`);
      const total = os.totalmem() / BYTES_PER_GB;
      const free = os.freemem() / BYTES_PER_GB;
      const used = total - free;
      return {
        total: Number(total.toFixed(2)),
        used: Number(used.toFixed(2)),
        free: Number(free.toFixed(2)),
        usage: Number(((used / total) * 100).toFixed(2)),
      };
    }
  }

  /**
   * 系统信息
   */
  private async getSysInfo(): Promise<SysVo> {
    const computerName = os.hostname();
    let computerIp = '127.0.0.1';
    let osName = os.type();
    let osArch: string = os.arch();

    try {
      const [osInfo, netInterfaces] = await Promise.all([si.osInfo(), si.networkInterfaces()]);
      osName = `${osInfo.distro} ${osInfo.release}`;
      osArch = String(osInfo.arch);

      // 取首个非内网 IPv4
      const net = netInterfaces.find((item) => !item.internal && item.ip4);
      if (net) {
        computerIp = net.ip4;
      }
    } catch (e) {
      this.logger.warn(`获取系统信息失败: ${(e as Error).message}`);
    }

    return {
      computerName,
      computerIp,
      osName,
      osArch,
      userDir: process.cwd(),
      sysTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      uptime: Number(os.uptime().toFixed(0)),
    };
  }

  /**
   * Node.js 运行时信息（兼容 JVM 字段）
   */
  private getNodeRuntimeInfo(): NodeRuntimeVo {
    const mem = process.memoryUsage();
    const totalMemory = mem.rss / BYTES_PER_GB;
    const usedMemory = totalMemory;
    const freeMemory = (os.totalmem() - os.freemem() - mem.rss) / BYTES_PER_GB;

    let nestVersion = '';
    try {
      // 读取 @nestjs/core 的 package.json 获取版本号
      const pkgPath = path.join(process.cwd(), 'node_modules', '@nestjs', 'core', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string };
      nestVersion = pkg.version || '';
    } catch {
      nestVersion = process.env.npm_package_dependencies_nestjs_core || '';
    }

    return {
      nodeVersion: process.version,
      nestVersion,
      runTime: Number(process.uptime().toFixed(0)),
      home: process.execPath,
      totalMemory: Number(totalMemory.toFixed(2)),
      usedMemory: Number(usedMemory.toFixed(2)),
      freeMemory: Number(Math.max(0, freeMemory).toFixed(2)),
      maxMemory: Number((os.totalmem() / BYTES_PER_GB).toFixed(2)),
    };
  }

  /**
   * 磁盘信息
   * @description Windows 返回各盘符，Linux 返回各挂载点
   */
  private async getDiskInfo(): Promise<DiskVo[]> {
    try {
      const fsSize = await si.fsSize();
      return fsSize.map((fs) => ({
        dirName: fs.fs,
        sysTypeName: fs.type,
        typeName: '固定磁盘',
        total: Number((fs.size / BYTES_PER_GB).toFixed(2)),
        used: Number((fs.used / BYTES_PER_GB).toFixed(2)),
        free: Number(((fs.size - fs.used) / BYTES_PER_GB).toFixed(2)),
        usage: Number((fs.use || 0).toFixed(2)),
      }));
    } catch (e) {
      this.logger.warn(`获取磁盘信息失败: ${(e as Error).message}`);
      return [];
    }
  }
}
