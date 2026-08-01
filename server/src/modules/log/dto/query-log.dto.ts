import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base.dto';

/**
 * 操作日志查询 DTO
 * @description 对标若依 SysOperLog 查询条件
 *
 * @使用示例
 * ```ts
 * // GET /oper-log?title=用户&businessType=1&page=1&pageSize=10
 * ```
 */
export class QueryLogDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: '模块标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '操作人员' })
  @IsString()
  @IsOptional()
  operName?: string;

  @ApiPropertyOptional({ description: '业务类型: 0-其它 1-新增 2-修改 3-删除' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ description: '操作状态: 0-正常 1-异常' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '请求方式' })
  @IsString()
  @IsOptional()
  requestMethod?: string;
}
