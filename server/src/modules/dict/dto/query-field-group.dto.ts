import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';

export class QueryFieldGroupDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '分组名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用' })
  @IsString()
  @IsOptional()
  status?: string;
}
