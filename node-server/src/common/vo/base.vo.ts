import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseVo {
  @ApiProperty({ description: 'ID' })
  id: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class BaseListVo<T> {
  @ApiProperty({ description: '列表数据' })
  list: T[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;
}
