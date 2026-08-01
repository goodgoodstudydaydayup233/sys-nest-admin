import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

export class RoleVo {
  @ApiProperty({ description: '角色ID' })
  id: number;

  @ApiProperty({ description: '角色名称' })
  name: string;
}

export class UserVo extends BaseVo {
  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiPropertyOptional({ description: '昵称' })
  nickname?: string;

  @ApiPropertyOptional({ description: '邮箱' })
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  phone?: string;

  @ApiPropertyOptional({ description: '头像' })
  avatar?: string;

  @ApiProperty({ description: '状态: 0-禁用 1-启用' })
  status: string;

  @ApiPropertyOptional({ description: '性别: 0-男 1-女 3-未知' })
  sex?: string;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;

  @ApiPropertyOptional({ description: '角色列表', type: [RoleVo] })
  roles?: RoleVo[];
}

export class UserListVo {
  @ApiProperty({ description: '用户列表', type: [UserVo] })
  list: UserVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
