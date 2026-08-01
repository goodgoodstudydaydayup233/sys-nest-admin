import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';
import { Type } from 'class-transformer';

export class QueryDictTypeDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '字典名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '所属分组ID' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用' })
  @IsString()
  @IsOptional()
  status?: string;
}
