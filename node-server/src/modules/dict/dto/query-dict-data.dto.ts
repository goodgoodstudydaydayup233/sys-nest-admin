import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';
import { Type } from 'class-transformer';

export class QueryDictDataDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '字典标签' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: '所属字典类型ID' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  typeId?: number;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsString()
  @IsOptional()
  dictType?: string;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用' })
  @IsString()
  @IsOptional()
  status?: string;
}
