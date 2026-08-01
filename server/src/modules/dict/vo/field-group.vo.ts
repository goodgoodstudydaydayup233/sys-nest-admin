import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class FieldGroupVo extends BaseVo {
  @ApiProperty({ description: '分组名称' })
  name: string;

  @ApiProperty({ description: '分组编码' })
  code: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '状态: 0-禁用 1-启用' })
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

export class FieldGroupListVo {
  @ApiProperty({ description: '分组列表', type: [FieldGroupVo] })
  list: FieldGroupVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
