import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfigDto {
  @ApiProperty({ description: '配置键' })
  @IsString()
  @IsNotEmpty({ message: '配置键不能为空' })
  configKey: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  @IsNotEmpty({ message: '配置值不能为空' })
  configValue: string;

  @ApiProperty({ description: '配置名称' })
  @IsString()
  @IsNotEmpty({ message: '配置名称不能为空' })
  name: string;

  @ApiPropertyOptional({ description: '配置分组', default: 'system' })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
