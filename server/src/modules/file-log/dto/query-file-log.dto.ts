import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto, BaseQueryDto } from '../../../common/dto/base.dto';

/** 日志分类合法值 */
export const LOG_CATEGORY_VALUES = ['access', 'app', 'error'] as const;
/** 日志级别合法值 */
export const LOG_LEVEL_VALUES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'VERBOSE'] as const;

/**
 * 日志文件列表查询 DTO
 * @description 按分类查询日志文件列表
 *
 * @使用示例
 * ```ts
 * // GET /file-log/files?category=access&page=1&pageSize=10
 * ```
 */
export class QueryFileLogFilesDto extends BasePaginationDto {
  @ApiProperty({ description: '日志分类: access-访问日志 app-应用日志 error-错误日志', default: 'access' })
  @IsIn(LOG_CATEGORY_VALUES)
  category: 'access' | 'app' | 'error' = 'access';
}

/**
 * 日志内容查询 DTO
 * @description 读取日志文件内容，支持分类/级别/关键字/时间范围筛选与分页
 *
 * @使用示例
 * ```ts
 * // GET /file-log/entries?category=access&level=INFO&keyword=admin&startTime=2026-08-15 00:00:00&page=1&pageSize=20
 * // GET /file-log/entries?fileName=access-20260815-0001.log&level=ERROR
 * ```
 */
export class QueryFileLogEntriesDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: '日志分类: access-访问日志 app-应用日志 error-错误日志', default: 'access' })
  @IsIn(LOG_CATEGORY_VALUES)
  @IsOptional()
  category?: 'access' | 'app' | 'error' = 'access';

  @ApiPropertyOptional({ description: '日志级别（精确匹配）: DEBUG/INFO/WARN/ERROR/VERBOSE' })
  @IsIn(LOG_LEVEL_VALUES)
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({ description: '指定日志文件名（精确查看单个文件时使用，如 access-20260815-0001.log）' })
  @IsString()
  @IsOptional()
  fileName?: string;
}

/**
 * 删除日志文件 DTO
 */
export class RemoveFileLogDto {
  @ApiProperty({ description: '日志文件名，如 access-20260815-0001.log' })
  @IsString()
  name: string;
}

/**
 * 日志文件原始内容查询 DTO
 * @description 按行分页读取日志文件的原始文本内容（在线预览用）
 *
 * @使用示例
 * ```ts
 * // GET /file-log/raw?fileName=access-20260815-0001.log&page=1&pageSize=500
 * ```
 */
export class QueryFileLogRawDto extends BasePaginationDto {
  @ApiProperty({ description: '日志文件名，如 access-20260815-0001.log' })
  @IsString()
  fileName: string;
}
