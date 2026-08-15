import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string;

  @ApiProperty({ description: '角色编码' })
  @IsString()
  @IsNotEmpty({ message: '角色编码不能为空' })
  code: string;

  @ApiPropertyOptional({ description: '权限标识' })
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用', default: '1' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '菜单ID列表', type: [Number] })
  @IsArray()
  @IsOptional()
  menuIds?: number[];
}
