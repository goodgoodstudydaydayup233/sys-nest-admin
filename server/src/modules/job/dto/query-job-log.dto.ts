import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';

/**
 * 定时任务调度日志查询 DTO
 *
 * @example
 * ```ts
 * // 查询 2026-08-01 至 2026-08-31 失败的调度日志
 * { page: 1, pageSize: 10, status: '1', beginTime: '2026-08-01', endTime: '2026-08-31' }
 * ```
 */
export class QueryJobLogDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '任务名称' })
  @IsString()
  @IsOptional()
  jobName?: string;

  @ApiPropertyOptional({ description: '任务组名' })
  @IsString()
  @IsOptional()
  jobGroup?: string;

  @ApiPropertyOptional({ description: '执行状态: 0-成功 1-失败' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;
}
