import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDictDataDto {
  @ApiProperty({ description: '字典标签' })
  @IsString()
  @IsNotEmpty({ message: '字典标签不能为空' })
  label: string;

  @ApiProperty({ description: '字典值' })
  @IsString()
  @IsNotEmpty({ message: '字典值不能为空' })
  value: string;

  @ApiProperty({ description: '所属字典类型ID' })
  @IsNumber()
  @IsNotEmpty({ message: '所属字典类型不能为空' })
  typeId: number;

  @ApiPropertyOptional({ description: '回显样式' })
  @IsString()
  @IsOptional()
  cssClass?: string;

  @ApiPropertyOptional({ description: '标签类型: primary/success/danger/warning/info' })
  @IsString()
  @IsOptional()
  listClass?: string;

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
