import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * 在线用户查询 DTO
 * @description 支持按用户名和 IP 模糊筛选
 *
 * @使用示例
 * GET /monitor/online/list?username=admin&ipaddr=192.168
 */
export class QueryOnlineDto {
  @ApiPropertyOptional({ description: '用户名（模糊匹配）' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: '登录 IP（模糊匹配）' })
  @IsString()
  @IsOptional()
  ipaddr?: string;
}
