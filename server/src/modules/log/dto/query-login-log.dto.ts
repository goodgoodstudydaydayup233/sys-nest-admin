import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base.dto';

/**
 * 登录日志查询 DTO
 * @description 对标若依 SysLogininfor 查询条件
 *
 * @使用示例
 * ```ts
 * // GET /logininfor?userName=admin&status=0&page=1&pageSize=10
 * ```
 */
export class QueryLoginLogDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: '登录账号' })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiPropertyOptional({ description: '登录IP地址' })
  @IsString()
  @IsOptional()
  ipaddr?: string;

  @ApiPropertyOptional({ description: '登录状态: 0-成功 1-失败' })
  @IsString()
  @IsOptional()
  status?: string;
}
