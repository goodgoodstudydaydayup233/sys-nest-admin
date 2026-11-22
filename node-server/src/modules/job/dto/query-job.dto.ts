import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';

/**
 * 定时任务查询 DTO
 *
 * @example
 * ```ts
 * // 查询默认组中状态正常的任务，第1页每页10条
 * { page: 1, pageSize: 10, jobGroup: 'DEFAULT', status: '0' }
 * ```
 */
export class QueryJobDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '任务名称' })
  @IsString()
  @IsOptional()
  jobName?: string;

  @ApiPropertyOptional({ description: '任务组名' })
  @IsString()
  @IsOptional()
  jobGroup?: string;

  @ApiPropertyOptional({ description: '状态: 0-正常 1-暂停' })
  @IsString()
  @IsOptional()
  status?: string;
}
