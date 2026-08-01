import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class DictTypeVo extends BaseVo {
  @ApiProperty({ description: '字典名称' })
  name: string;

  @ApiProperty({ description: '字典类型' })
  type: string;

  @ApiPropertyOptional({ description: '所属分组ID（不分组时为 null）' })
  groupId?: number | null;

  @ApiPropertyOptional({ description: '所属分组名称' })
  groupName?: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '状态: 0-禁用 1-启用' })
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

export class DictTypeListVo {
  @ApiProperty({ description: '字典类型列表', type: [DictTypeVo] })
  list: DictTypeVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
