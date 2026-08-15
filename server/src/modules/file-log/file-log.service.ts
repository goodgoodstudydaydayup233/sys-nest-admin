import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { AppConfigService } from '../../core/config/config.service';
import {
  QueryFileLogEntriesDto,
  QueryFileLogFilesDto,
  QueryFileLogRawDto,
} from './dto/query-file-log.dto';
import {
  FileLogEntriesVo,
  FileLogEntryVo,
  FileLogFileVo,
  FileLogFilesVo,
  FileLogRawVo,
} from './vo/file-log.vo';

/** 日志文件名校验：{category}-{YYYYMMDD}-{4位序号}.log */
const FILE_NAME_RE = /^(access|app|error)-\d{8}-\d{4}\.log$/;

/** 内容查询时最多扫描的文件数（从新到旧） */
const MAX_FILES_SCAN = 20;
/** 内容查询时最多扫描的总行数，防止超大日志拖垮内存 */
const MAX_LINES_SCAN = 200_000;
/** 原始内容预览时最多读取的总行数，超出则截断提示 */
const MAX_RAW_LINES = 500_000;

/**
 * 文件日志查询服务
 * @description 提供文件日志的读取能力：
 * - listFiles：按分类列出日志文件（名称/大小/修改时间）
 * - readEntries：按分类/级别/关键字/时间范围读取并筛选日志内容（分页）
 * - removeFile：删除指定日志文件
 * - resolveFilePath：校验并解析文件名对应的绝对路径（供下载使用）
 *
 * 所有文件名均经过白名单正则校验，杜绝路径穿越。
 */
@Injectable()
export class FileLogService {
  private readonly baseDir: string;

  constructor(private readonly configService: AppConfigService) {
    this.baseDir = path.resolve(process.cwd(), configService.fileLog.dir);
  }

  /**
   * 列出指定分类的日志文件
   * @description 按文件名倒序（新的在前）分页返回，并附分类下总大小
   *
   * @使用示例
   * ```ts
   * const result = await service.listFiles({ category: 'access', page: 1, pageSize: 10 });
   * ```
   */
  async listFiles(dto: QueryFileLogFilesDto): Promise<FileLogFilesVo> {
    const category = dto.category ?? 'access';
    const dir = this.categoryDir(category);
    const files = await this.scanFiles(dir);

    // 文件名倒序：日期越大越新，同日序号越大越新
    files.sort((a, b) => b.name.localeCompare(a.name));

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;
    const start = (page - 1) * pageSize;

    return {
      list: files.slice(start, start + pageSize).map((f) => this.toFileVo(f, category)),
      total: totalFiles,
      page,
      pageSize,
      totalSize,
      totalSizeText: this.formatSize(totalSize),
      totalFiles,
    };
  }

  /**
   * 读取并筛选日志内容
   * @description 按时间范围/级别/关键字过滤，从新到旧分页返回。
   * 未传时间范围时默认只读取"今天"的日志文件；未传 fileName 时最多扫描最近 20 个文件。
   * 为避免超大日志影响性能，扫描总行数超过 20 万行会截断并在 truncated 中提示。
   *
   * @使用示例
   * ```ts
   * const result = await service.readEntries({ category: 'access', level: 'ERROR', keyword: 'user', page: 1, pageSize: 20 });
   * ```
   */
  async readEntries(dto: QueryFileLogEntriesDto): Promise<FileLogEntriesVo> {
    const category = dto.category ?? 'access';
    const dir = this.categoryDir(category);

    // 确定要扫描的文件
    let fileNames: string[];
    if (dto.fileName) {
      this.assertValidFileName(dto.fileName, category);
      fileNames = [dto.fileName];
    } else {
      const allNames = await this.listFileNames(dir);
      fileNames = this.filterNamesByRange(allNames, category, dto.startTime, dto.endTime);
      // 从新到旧，限制扫描数量
      fileNames.sort((a, b) => b.localeCompare(a));
      fileNames = fileNames.slice(0, MAX_FILES_SCAN);
    }

    const entries: FileLogEntryVo[] = [];
    let scannedLines = 0;
    let truncated = false;

    for (const name of fileNames) {
      if (scannedLines >= MAX_LINES_SCAN) {
        truncated = true;
        break;
      }
      const filePath = path.join(dir, name);
      const { count, truncated: fileTruncated } = await this.scanFile(
        filePath,
        dto,
        entries,
        MAX_LINES_SCAN - scannedLines,
      );
      scannedLines += count;
      if (fileTruncated) {
        truncated = true;
        break;
      }
    }

    // 按时间从新到旧排序
    entries.sort((a, b) => (a.ts < b.ts ? 1 : -1));

    const total = entries.length;
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const start = (page - 1) * pageSize;

    return {
      list: entries.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      truncated,
    };
  }

  /**
   * 按行分页读取日志文件原始文本内容
   * @description 在线预览使用，返回未解析的原始日志行。
   * 单遍流式读取：统计总行数并收集当前页数据；超过 MAX_RAW_LINES 行时截断并标记 truncated。
   *
   * @使用示例
   * ```ts
   * const result = await service.readRaw({ fileName: 'access-20260815-0001.log', page: 1, pageSize: 500 });
   * ```
   */
  async readRaw(dto: QueryFileLogRawDto): Promise<FileLogRawVo> {
    const category = this.parseCategoryFromName(dto.fileName);
    const filePath = this.resolveFilePath(dto.fileName, category);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`日志文件不存在: ${dto.fileName}`);
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 500;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const content: string[] = [];
    let total = 0;
    let truncated = false;

    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (total >= MAX_RAW_LINES) {
        truncated = true;
        break;
      }
      total++;
      if (total > start && total <= end) {
        content.push(line);
      }
    }

    return { content, total, page, pageSize, truncated };
  }

  /**
   * 删除指定日志文件
   * @param name 文件名（必须通过白名单校验）
   */
  async removeFile(name: string): Promise<void> {
    const category = this.parseCategoryFromName(name);
    const filePath = this.resolveFilePath(name, category);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`日志文件不存在: ${name}`);
    }
    await fs.promises.unlink(filePath);
  }

  /**
   * 校验并解析文件绝对路径（供下载接口使用）
   * @param name 文件名
   * @param category 日志分类（由文件名推断）
   */
  resolveFilePath(name: string, category: string): string {
    this.assertValidFileName(name, category);
    const filePath = path.resolve(this.categoryDir(category), name);
    // 二次防护：确保解析后仍在日志根目录内
    if (!filePath.startsWith(this.baseDir + path.sep)) {
      throw new BadRequestException('非法日志文件路径');
    }
    return filePath;
  }

  // ==================== 内部工具 ====================

  private categoryDir(category: string): string {
    return path.join(this.baseDir, category);
  }

  /** 扫描目录返回文件原始信息 */
  private async scanFiles(
    dir: string,
  ): Promise<{ name: string; size: number; mtimeMs: number }[]> {
    if (!fs.existsSync(dir)) return [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files: { name: string; size: number; mtimeMs: number }[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !FILE_NAME_RE.test(entry.name)) continue;
      try {
        const stat = await fs.promises.stat(path.join(dir, entry.name));
        files.push({ name: entry.name, size: stat.size, mtimeMs: stat.mtimeMs });
      } catch {
        // 文件可能被并发删除，忽略
      }
    }
    return files;
  }

  private async listFileNames(dir: string): Promise<string[]> {
    const files = await this.scanFiles(dir);
    return files.map((f) => f.name);
  }

  /** 按时间范围过滤文件名（文件名中日期在 [startDate, endDate] 内） */
  private filterNamesByRange(
    names: string[],
    category: string,
    startTime?: string,
    endTime?: string,
  ): string[] {
    const startKey = startTime ? this.dateKeyOf(startTime) : '';
    const endKey = endTime ? this.dateKeyOf(endTime) : '';

    // 无时间范围时默认只看今天
    if (!startKey && !endKey) {
      const today = this.dateKeyOf(new Date().toISOString());
      return names.filter((n) => n.includes(`${category}-${today}-`));
    }

    const prefix = `${category}-`;
    return names.filter((n) => {
      const key = n.slice(prefix.length, prefix.length + 8);
      return (!startKey || key >= startKey) && (!endKey || key <= endKey);
    });
  }

  /** 逐行扫描单个日志文件，返回 [扫描行数, 是否截断] */
  private async scanFile(
    filePath: string,
    dto: QueryFileLogEntriesDto,
    output: FileLogEntryVo[],
    maxLines: number,
  ): Promise<{ count: number; truncated: boolean }> {
    if (!fs.existsSync(filePath)) return { count: 0, truncated: false };

    let count = 0;
    let truncated = false;

    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (count >= maxLines) {
        truncated = true;
        break;
      }
      count++;
      const entry = this.parseLine(line);
      if (!entry) continue;
      if (!this.matchFilters(entry, dto)) continue;
      output.push(entry);
    }

    return { count, truncated };
  }

  /** 解析单行 JSON 日志 */
  private parseLine(line: string): FileLogEntryVo | null {
    const trimmed = line.trim();
    if (!trimmed) return null;
    try {
      const raw = JSON.parse(trimmed) as Record<string, unknown>;
      return {
        ts: String(raw.ts ?? ''),
        level: String(raw.level ?? 'INFO'),
        category: String(raw.category ?? ''),
        message: String(raw.message ?? ''),
        context: raw.context ? String(raw.context) : undefined,
        stack: raw.stack ? String(raw.stack) : undefined,
        method: raw.method ? String(raw.method) : undefined,
        url: raw.url ? String(raw.url) : undefined,
        status: typeof raw.status === 'number' ? raw.status : undefined,
        ip: raw.ip ? String(raw.ip) : undefined,
        user: raw.user ? String(raw.user) : undefined,
        cost: typeof raw.cost === 'number' ? raw.cost : undefined,
        ua: raw.ua ? String(raw.ua) : undefined,
      };
    } catch {
      // 非 JSON 行（如手动追加的内容）不解析
      return null;
    }
  }

  /** 级别/关键字/时间范围筛选 */
  private matchFilters(entry: FileLogEntryVo, dto: QueryFileLogEntriesDto): boolean {
    if (dto.level && entry.level.toUpperCase() !== dto.level.toUpperCase()) return false;

    if (dto.startTime && entry.ts < dto.startTime) return false;
    if (dto.endTime && entry.ts > dto.endTime) return false;

    if (dto.keyword) {
      const haystack = [
        entry.message,
        entry.context,
        entry.method,
        entry.url,
        entry.ip,
        entry.user,
        entry.stack,
      ]
        .filter((v): v is string => !!v)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(dto.keyword.toLowerCase())) return false;
    }

    return true;
  }

  /** 校验文件名合法性，非法则抛 400 */
  private assertValidFileName(name: string, category: string): void {
    if (!FILE_NAME_RE.test(name) || !name.startsWith(`${category}-`)) {
      throw new BadRequestException(`非法的日志文件名: ${name}`);
    }
  }

  /** 从文件名推断分类（供删除/下载使用） */
  private parseCategoryFromName(name: string): string {
    const match = FILE_NAME_RE.exec(name);
    if (!match) throw new BadRequestException(`非法的日志文件名: ${name}`);
    return match[1];
  }

  /** 从时间字符串取日期键 YYYYMMDD（兼容 ISO 与 "YYYY-MM-DD HH:mm:ss"） */
  private dateKeyOf(value: string): string {
    const dateStr = value.slice(0, 10);
    return dateStr.replace(/-/g, '');
  }

  private toFileVo(
    file: { name: string; size: number; mtimeMs: number },
    category: string,
  ): FileLogFileVo {
    return {
      name: file.name,
      category,
      size: file.size,
      sizeText: this.formatSize(file.size),
      mtime: this.formatMtime(file.mtimeMs),
    };
  }

  /** 字节数人性化展示 */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private formatMtime(mtimeMs: number): string {
    const d = new Date(mtimeMs);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }
}
