import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';

export class QueryConfigDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '配置分组' })
  @IsString()
  @IsOptional()
  group?: string;
}
