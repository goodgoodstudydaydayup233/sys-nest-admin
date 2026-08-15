import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 收件箱分页查询参数
 * @description 支持按类型、已读状态、关键字、时间范围筛选
 *
 * @example
 * ```json
 * {
 *   "page": 1,
 *   "pageSize": 10,
 *   "type": "1",
 *   "status": "0",
 *   "keyword": "任务",
 *   "beginTime": "2026-08-01 00:00:00",
 *   "endTime": "2026-08-15 23:59:59"
 * }
 * ```
 */
export class QueryMessageDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须为整数' })
  @Min(1, { message: '页码最小为 1' })
  page: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页条数必须为整数' })
  @Min(1, { message: '每页条数最小为 1' })
  @Max(100, { message: '每页条数最大为 100' })
  pageSize: number = 10;

  @ApiPropertyOptional({ description: '消息类型: 1-系统通知 2-业务提醒 3-任务结果' })
  @IsOptional()
  @IsIn(['1', '2', '3'], { message: '消息类型仅支持 1-系统通知 / 2-业务提醒 / 3-任务结果' })
  type?: string;

  @ApiPropertyOptional({ description: '已读状态: 0-未读 1-已读' })
  @IsOptional()
  @IsIn(['0', '1'], { message: '状态仅支持 0-未读 / 1-已读' })
  status?: string;

  @ApiPropertyOptional({ description: '标题/内容关键字' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
