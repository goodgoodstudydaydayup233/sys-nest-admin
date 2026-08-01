import { IsString, IsNotEmpty, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称' })
  @IsString()
  @IsNotEmpty({ message: '字典名称不能为空' })
  name: string;

  @ApiProperty({ description: '字典类型' })
  @IsString()
  @IsNotEmpty({ message: '字典类型不能为空' })
  type: string;

  @ApiPropertyOptional({ description: '所属分组ID（不分组时传 null 或不传）' })
  @ValidateIf((o) => o.groupId !== null && o.groupId !== undefined)
  @IsNumber()
  @IsOptional()
  groupId?: number | null;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用', default: '1' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
