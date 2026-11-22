import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class MenuVo extends BaseVo {
  @ApiProperty({ description: '菜单名称' })
  menuName: string;

  @ApiProperty({ description: '父菜单ID' })
  parentId: number;

  @ApiProperty({ description: '显示顺序' })
  orderNum: number;

  @ApiPropertyOptional({ description: '路由地址' })
  path?: string;

  @ApiPropertyOptional({ description: '组件路径' })
  component?: string;

  @ApiPropertyOptional({ description: '路由参数' })
  query?: string;

  @ApiProperty({ description: '是否为外链: 0-是 1-否' })
  isFrame: string;

  @ApiProperty({ description: '是否缓存: 0-是 1-否' })
  isCache: string;

  @ApiProperty({ description: '是否显示: 0-是 1-否' })
  visible: string;

  @ApiProperty({ description: '菜单类型: M-目录 C-菜单 F-按钮' })
  menuType: string;

  @ApiPropertyOptional({ description: '权限标识' })
  perms?: string;

  @ApiPropertyOptional({ description: '菜单图标' })
  icon?: string;
}

export class MenuTreeVo extends MenuVo {
  @ApiPropertyOptional({ description: '子菜单', type: [MenuTreeVo] })
  children?: MenuTreeVo[];
}
