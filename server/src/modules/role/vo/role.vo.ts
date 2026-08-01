import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class MenuVo {
  @ApiProperty({ description: '菜单ID' })
  id: number;

  @ApiProperty({ description: '菜单名称' })
  menuName: string;

  @ApiPropertyOptional({ description: '权限标识' })
  perms?: string;
}

export class RoleVo extends BaseVo {
  @ApiProperty({ description: '角色名称' })
  name: string;

  @ApiPropertyOptional({ description: '权限标识' })
  permission?: string;

  @ApiProperty({ description: '状态: 0-禁用 1-启用' })
  status: string;

  @ApiPropertyOptional({ description: '排序' })
  sort?: number;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;

  @ApiPropertyOptional({ description: '菜单列表', type: [MenuVo] })
  menus?: MenuVo[];
}

export class RoleListVo {
  @ApiProperty({ description: '角色列表', type: [RoleVo] })
  list: RoleVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
