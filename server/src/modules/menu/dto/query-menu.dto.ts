import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMenuDto {
  @ApiPropertyOptional({ description: '菜单名称' })
  @IsString()
  @IsOptional()
  menuName?: string;

  @ApiPropertyOptional({ description: '是否显示: 0-是 1-否' })
  @IsString()
  @IsOptional()
  visible?: string;
}
