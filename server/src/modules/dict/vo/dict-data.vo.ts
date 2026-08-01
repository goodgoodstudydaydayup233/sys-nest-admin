import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class DictDataVo extends BaseVo {
  @ApiProperty({ description: '字典标签' })
  label: string;

  @ApiProperty({ description: '字典值' })
  value: string;

  @ApiProperty({ description: '所属字典类型ID' })
  typeId: number;

  @ApiPropertyOptional({ description: '回显样式' })
  cssClass?: string;

  @ApiPropertyOptional({ description: '标签类型' })
  listClass?: string;

  @ApiProperty({ description: '排序' })
  sort: number;

  @ApiProperty({ description: '状态: 0-禁用 1-启用' })
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

export class DictDataListVo {
  @ApiProperty({ description: '字典数据列表', type: [DictDataVo] })
  list: DictDataVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
