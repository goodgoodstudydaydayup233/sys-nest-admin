import { Injectable, LoggerService, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfigService } from '../../core/config/config.service';

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'verbose';

/** 日志分类 */
export type LogCategory = 'access' | 'app' | 'error';

/** 日志分类目录名列表（与文件日志子目录一一对应） */
export const LOG_CATEGORIES: LogCategory[] = ['access', 'app', 'error'];

/** 总大小清理检查的最小间隔（毫秒），避免每次写入都触发 stat */
const CLEANUP_INTERVAL_MS = 10_000;

/** 单个分类正在写入的流状态 */
interface CategoryWriter {
  /** 当前日志文件写入流 */
  stream: fs.WriteStream | null;
  /** 当前日志文件全名，如 access-20260815-0001.log */
  fileName: string;
  /** 当前日志文件绝对路径 */
  filePath: string;
  /** 当日文件序号（从 1 开始，达到单文件大小上限后递增） */
  seq: number;
  /** 当前文件已写入字节数（估算，用于触发滚动） */
  bytes: number;
  /** 当前文件日期键 YYYYMMDD */
  dateKey: string;
  /** 上次执行总大小清理的时间戳 */
  lastCleanupAt: number;
}

/**
 * 企业级文件日志服务
 * @description 基于 Node 原生流实现的高性能文件日志，满足企业级规范：
 *
 * 1. 结构化存储：每条日志一行 JSON（含时间/级别/分类/业务字段），便于程序解析与审计
 * 2. 多分类隔离：access（访问日志）/ app（应用日志）/ error（错误日志）分目录存储
 * 3. 按天 + 按大小双重滚动：每天一个文件，单文件达到 maxFileSize(MB) 自动滚动新文件
 * 4. 总容量控制：单分类日志总大小超过 maxTotalSize(MB) 时自动清理最旧文件（保留当前文件）
 * 5. 异步不阻塞：每分类独立串行队列 + 写流背压处理，日志写入不影响主流程
 * 6. Nest 集成：实现 LoggerService，可直接 app.useLogger() 接管框架日志
 *
 * 文件命名规范：{category}-{YYYYMMDD}-{序号4位}.log，如 access-20260815-0001.log
 *
 * @使用示例
 * ```ts
 * // 注入
 * constructor(private readonly logger: FileLoggerService) {}
 *
 * // 通用写入（自动补充 ts/level/category）
 * this.logger.write('app', 'info', { message: '用户上线', context: 'UserService' });
 *
 * // 访问日志（由全局中间件调用）
 * this.logger.access({ method: 'GET', url: '/user', status: 200, ip: '127.0.0.1', cost: 12 });
 *
 * // 错误日志（同时写入 app 与 error 分类）
 * this.logger.error('数据库连接失败', err.stack, 'DatabaseModule');
 * ```
 */
@Injectable()
export class FileLoggerService implements LoggerService, OnModuleInit, OnModuleDestroy {
  private readonly enabled: boolean;
  private readonly baseDir: string;
  private readonly maxFileSizeBytes: number;
  private readonly maxTotalSizeBytes: number;
  private readonly accessEnabled: boolean;

  /** 各分类当前写流状态 */
  private readonly writers: Partial<Record<LogCategory, CategoryWriter>> = {};
  /** 各分类写入串行队列（保证同分类日志顺序一致） */
  private readonly queues: Partial<Record<LogCategory, Promise<void>>> = {};

  constructor(private readonly configService: AppConfigService) {
    const cfg = configService.fileLog;
    this.enabled = cfg.enabled;
    this.baseDir = path.resolve(process.cwd(), cfg.dir);
    this.maxFileSizeBytes = Math.max(1, cfg.maxFileSize) * 1024 * 1024;
    this.maxTotalSizeBytes = Math.max(1, cfg.maxTotalSize) * 1024 * 1024;
    this.accessEnabled = cfg.accessEnabled;
  }

  onModuleInit(): void {
    if (!this.enabled) return;
    // 初始化目录结构
    fs.mkdirSync(this.baseDir, { recursive: true });
    for (const category of LOG_CATEGORIES) {
      fs.mkdirSync(path.join(this.baseDir, category), { recursive: true });
    }
    // 启动时执行一次总大小清理
    void this.cleanupAll();
  }

  onModuleDestroy(): void {
    // 关闭所有写流，确保缓冲内容落盘
    for (const category of LOG_CATEGORIES) {
      const writer = this.writers[category];
      if (writer?.stream) {
        writer.stream.end();
        writer.stream = null;
      }
    }
  }

  // ==================== 通用写入入口 ====================

  /**
   * 写入一条日志
   * @param category 日志分类（access/app/error）
   * @param level 日志级别
   * @param data 业务字段（自动补充 ts/level/category，勿传这三个键）
   *
   * @使用示例
   * ```ts
   * this.logger.write('app', 'warn', { message: '接口响应较慢', context: 'AuthController', cost: 3000 });
   * ```
   */
  write(category: LogCategory, level: LogLevel, data: Record<string, unknown> = {}): void {
    if (!this.enabled) {
      this.fallbackConsole(level, data.message, data.context as string | undefined);
      return;
    }
    if (category === 'access' && !this.accessEnabled) return;

    const line = JSON.stringify({
      ts: this.formatTime(new Date()),
      level: level.toUpperCase(),
      category,
      ...data,
    });
    this.enqueue(category, () => this.append(category, line));
  }

  /** 写入访问日志（由全局访问日志中间件调用） */
  access(data: Record<string, unknown>): void {
    this.write('access', 'info', data);
  }

  /** 写入应用级 info 日志（LoggerService.log 接口实现） */
  log(message: unknown, context?: string): void {
    this.write('app', 'info', { message: String(message), context });
  }

  /** 写入应用级 info 日志 */
  info(message: unknown, context?: string): void {
    this.log(message, context);
  }

  /** 写入应用级 warn 日志 */
  warn(message: unknown, context?: string): void {
    this.write('app', 'warn', { message: String(message), context });
  }

  /** 写入应用级 debug 日志 */
  debug(message: unknown, context?: string): void {
    this.write('app', 'debug', { message: String(message), context });
  }

  /** 写入应用级 verbose 日志 */
  verbose(message: unknown, context?: string): void {
    this.write('app', 'verbose', { message: String(message), context });
  }

  /**
   * 写入错误日志（Nest LoggerService 签名兼容）
   * @description 同时写入 app 与 error 两个分类，便于错误单独审计。
   * 兼容两种调用方式：error(msg, context) / error(msg, stack, context)
   */
  error(message: unknown, stackOrContext?: string, context?: string): void {
    let stack: string | undefined;
    let ctx = context;
    if (typeof stackOrContext === 'string') {
      if (stackOrContext.includes('\n')) {
        stack = stackOrContext;
      } else {
        ctx = stackOrContext;
      }
    }
    const payload = { message: String(message), context: ctx, stack };
    this.write('app', 'error', payload);
    this.write('error', 'error', payload);
  }

  // ==================== 内部实现 ====================

  /** 将任务加入分类串行队列 */
  private enqueue(category: LogCategory, task: () => void): void {
    const prev = this.queues[category] ?? Promise.resolve();
    this.queues[category] = prev.then(task).catch((err: unknown) => {
      // 队列异常兜底，避免影响主流程
      console.error('[FileLogger] 日志写入队列异常:', err);
    });
  }

  /** 追加一行到当前文件（队列内串行执行） */
  private append(category: LogCategory, line: string): void {
    const writer = this.ensureWriter(category);
    if (!writer || !writer.stream) return;

    const lineBytes = Buffer.byteLength(line) + 1; // +1 为换行符
    // 达到单文件大小上限 → 滚动新文件（跳过超长单行，避免无限滚动）
    if (writer.bytes > 0 && writer.bytes + lineBytes > this.maxFileSizeBytes && lineBytes <= this.maxFileSizeBytes) {
      this.rotate(category, writer);
    }
    writer.bytes += lineBytes;
    writer.stream.write(line + '\n');
    this.maybeCleanup(category);
  }

  /** 确保当前分类写流有效（处理跨天与流异常重建） */
  private ensureWriter(category: LogCategory): CategoryWriter | null {
    const dateKey = this.getDateKey();
    let writer = this.writers[category];
    if (writer && writer.dateKey === dateKey && writer.stream) return writer;

    // 跨天或流已损坏：关闭旧流并创建新文件
    if (writer?.stream) {
      writer.stream.end();
      writer.stream = null;
    }
    writer = this.createWriter(category, dateKey);
    this.writers[category] = writer;
    return writer;
  }

  /** 创建当日新文件写流（序号取当日已有文件最大值 + 1） */
  private createWriter(category: LogCategory, dateKey: string): CategoryWriter {
    const dir = path.join(this.baseDir, category);
    fs.mkdirSync(dir, { recursive: true });

    const seq = this.nextSeq(dir, category, dateKey);
    const fileName = `${category}-${dateKey}-${String(seq).padStart(4, '0')}.log`;
    const filePath = path.join(dir, fileName);

    const writer: CategoryWriter = {
      stream: null,
      fileName,
      filePath,
      seq,
      bytes: 0,
      dateKey,
      lastCleanupAt: 0,
    };
    writer.stream = this.openStream(filePath, writer);
    return writer;
  }

  /** 打开追加写流并绑定错误监听 */
  private openStream(filePath: string, writer: CategoryWriter): fs.WriteStream {
    const stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
    stream.on('error', (err: NodeJS.ErrnoException) => {
      // 写流异常时置空，下一条日志触发重建；避免 unhandled error 崩溃进程
      console.error(`[FileLogger] 写入文件失败 ${filePath}:`, err);
      writer.stream = null;
    });
    return stream;
  }

  /** 滚动新文件（关闭旧流，序号 +1） */
  private rotate(category: LogCategory, writer: CategoryWriter): void {
    if (writer.stream) {
      writer.stream.end();
      writer.stream = null;
    }
    writer.seq += 1;
    writer.fileName = `${category}-${writer.dateKey}-${String(writer.seq).padStart(4, '0')}.log`;
    writer.filePath = path.join(this.baseDir, category, writer.fileName);
    writer.bytes = 0;
    writer.stream = this.openStream(writer.filePath, writer);
  }

  /** 计算当日下一个文件序号 */
  private nextSeq(dir: string, category: LogCategory, dateKey: string): number {
    const prefix = `${category}-${dateKey}-`;
    let max = 0;
    for (const name of fs.readdirSync(dir)) {
      if (!name.startsWith(prefix) || !name.endsWith('.log')) continue;
      const seqPart = name.slice(prefix.length, -4);
      const seq = Number.parseInt(seqPart, 10);
      if (!Number.isNaN(seq) && seq > max) max = seq;
    }
    return max + 1;
  }

  /** 节流触发总大小清理 */
  private maybeCleanup(category: LogCategory): void {
    const writer = this.writers[category];
    if (!writer) return;
    const now = Date.now();
    if (now - writer.lastCleanupAt < CLEANUP_INTERVAL_MS) return;
    writer.lastCleanupAt = now;
    void this.cleanupCategory(category);
  }

  /** 启动时对所有分类执行一次总大小清理 */
  private async cleanupAll(): Promise<void> {
    for (const category of LOG_CATEGORIES) {
      try {
        await this.cleanupCategory(category);
      } catch (err) {
        console.error(`[FileLogger] 启动清理 ${category} 失败:`, err);
      }
    }
  }

  /**
   * 单分类总大小清理
   * @description 按修改时间从旧到新删除文件，直到总大小低于上限；始终保留当前正在写入的文件。
   */
  private async cleanupCategory(category: LogCategory): Promise<void> {
    const dir = path.join(this.baseDir, category);
    if (!fs.existsSync(dir)) return;

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files: { name: string; size: number; mtimeMs: number }[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.log')) continue;
      const stat = await fs.promises.stat(path.join(dir, entry.name));
      files.push({ name: entry.name, size: stat.size, mtimeMs: stat.mtimeMs });
    }

    let total = files.reduce((sum, f) => sum + f.size, 0);
    if (total <= this.maxTotalSizeBytes) return;

    const currentName = this.writers[category]?.fileName;
    const removable = files
      .filter((f) => f.name !== currentName)
      .sort((a, b) => a.mtimeMs - b.mtimeMs);

    for (const file of removable) {
      if (total <= this.maxTotalSizeBytes) break;
      try {
        await fs.promises.unlink(path.join(dir, file.name));
        total -= file.size;
      } catch (err) {
        console.error(`[FileLogger] 删除旧日志文件失败 ${file.name}:`, err);
      }
    }
  }

  /** 未启用文件日志时，回退到控制台输出 */
  private fallbackConsole(level: LogLevel, message: unknown, context?: string): void {
    const prefix = context ? `[${context}] ` : '';
    const text = `${prefix}${String(message)}`;
    switch (level) {
      case 'error':
        console.error(text);
        break;
      case 'warn':
        console.warn(text);
        break;
      case 'debug':
      case 'verbose':
        console.debug(text);
        break;
      default:
        console.log(text);
    }
  }

  /** 当前日期键 YYYYMMDD（本地时区） */
  private getDateKey(): string {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('');
  }

  /** 格式化为 YYYY-MM-DD HH:mm:ss.SSS（本地时区） */
  private formatTime(date: Date): string {
    const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
    );
  }
}
