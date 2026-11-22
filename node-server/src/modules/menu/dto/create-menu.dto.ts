import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称' })
  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  menuName: string;

  @ApiPropertyOptional({ description: '父菜单ID', default: 0 })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ description: '显示顺序', default: 0 })
  @IsInt()
  @IsOptional()
  orderNum?: number;

  @ApiPropertyOptional({ description: '路由地址' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: '组件路径' })
  @IsString()
  @IsOptional()
  component?: string;

  @ApiPropertyOptional({ description: '路由参数' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: '是否为外链: 0-是 1-否', default: '1' })
  @IsString()
  @IsOptional()
  isFrame?: string;

  @ApiPropertyOptional({ description: '是否缓存: 0-是 1-否', default: '0' })
  @IsString()
  @IsOptional()
  isCache?: string;

  @ApiPropertyOptional({ description: '是否显示: 0-是 1-否', default: '0' })
  @IsString()
  @IsOptional()
  visible?: string;

  @ApiPropertyOptional({ description: '菜单类型: M-目录 C-菜单 F-按钮', default: 'M' })
  @IsString()
  @IsOptional()
  menuType?: string;

  @ApiPropertyOptional({ description: '权限标识' })
  @IsString()
  @IsOptional()
  perms?: string;

  @ApiPropertyOptional({ description: '菜单图标' })
  @IsString()
  @IsOptional()
  icon?: string;
}
