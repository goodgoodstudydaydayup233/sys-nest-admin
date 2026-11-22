import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 日志文件视图对象
 */
export class FileLogFileVo {
  @ApiProperty({ description: '文件名，如 access-20260815-0001.log' })
  name: string;

  @ApiProperty({ description: '日志分类: access/app/error' })
  category: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: number;

  @ApiProperty({ description: '文件大小（人性化展示，如 2.5 MB）' })
  sizeText: string;

  @ApiProperty({ description: '最后修改时间' })
  mtime: string;
}

/**
 * 日志文件列表响应
 */
export class FileLogFilesVo {
  @ApiProperty({ type: [FileLogFileVo], description: '当前页文件列表' })
  list: FileLogFileVo[];

  @ApiProperty({ description: '文件总数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;

  @ApiProperty({ description: '分类下全部文件总大小（字节）' })
  totalSize: number;

  @ApiProperty({ description: '分类下全部文件总大小（人性化展示）' })
  totalSizeText: string;

  @ApiProperty({ description: '分类下文件总数' })
  totalFiles: number;
}

/**
 * 单条日志内容视图对象
 */
export class FileLogEntryVo {
  @ApiProperty({ description: '日志时间（本地时区 YYYY-MM-DD HH:mm:ss.SSS）' })
  ts: string;

  @ApiProperty({ description: '日志级别: DEBUG/INFO/WARN/ERROR/VERBOSE' })
  level: string;

  @ApiProperty({ description: '日志分类: access/app/error' })
  category: string;

  @ApiProperty({ description: '日志摘要（访问日志为 "方法 路径 状态码"，其余为日志消息）' })
  message: string;

  @ApiPropertyOptional({ description: '应用日志上下文（如模块/类名）' })
  context?: string;

  @ApiPropertyOptional({ description: '异常堆栈（仅错误日志）' })
  stack?: string;

  @ApiPropertyOptional({ description: '请求方式（仅访问日志）' })
  method?: string;

  @ApiPropertyOptional({ description: '请求路径（仅访问日志）' })
  url?: string;

  @ApiPropertyOptional({ description: 'HTTP 状态码（仅访问日志）' })
  status?: number;

  @ApiPropertyOptional({ description: '客户端 IP（仅访问日志）' })
  ip?: string;

  @ApiPropertyOptional({ description: '操作人用户名（仅访问日志）' })
  user?: string;

  @ApiPropertyOptional({ description: '请求耗时（毫秒，仅访问日志）' })
  cost?: number;

  @ApiPropertyOptional({ description: 'User-Agent（仅访问日志）' })
  ua?: string;
}

/**
 * 日志内容分页响应
 */
export class FileLogEntriesVo {
  @ApiProperty({ type: [FileLogEntryVo], description: '当前页日志条目' })
  list: FileLogEntryVo[];

  @ApiProperty({ description: '符合筛选条件的日志条数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;

  @ApiPropertyOptional({ description: '是否因扫描行数达到上限而截断（结果可能不完整）' })
  truncated?: boolean;
}

/**
 * 日志文件原始内容分页响应（在线预览）
 */
export class FileLogRawVo {
  @ApiProperty({ description: '当前页原始文本行（不含换行符）' })
  content: string[];

  @ApiProperty({ description: '文件总行数（达到读取上限时为截断行数）' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页行数' })
  pageSize: number;

  @ApiPropertyOptional({ description: '是否因文件过大只读取了部分行' })
  truncated?: boolean;
}
