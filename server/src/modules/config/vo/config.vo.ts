import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class ConfigVo extends BaseVo {
  @ApiProperty({ description: '配置键' })
  configKey: string;

  @ApiProperty({ description: '配置值' })
  configValue: string;

  @ApiProperty({ description: '配置名称' })
  name: string;

  @ApiProperty({ description: '配置分组' })
  group: string;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

export class ConfigListVo {
  @ApiProperty({ description: '配置列表', type: [ConfigVo] })
  list: ConfigVo[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;
}
