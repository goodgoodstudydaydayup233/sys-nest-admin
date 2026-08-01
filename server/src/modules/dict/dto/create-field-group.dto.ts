import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFieldGroupDto {
  @ApiProperty({ description: '分组名称' })
  @IsString()
  @IsNotEmpty({ message: '分组名称不能为空' })
  name: string;

  @ApiProperty({ description: '分组编码' })
  @IsString()
  @IsNotEmpty({ message: '分组编码不能为空' })
  code: string;

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
