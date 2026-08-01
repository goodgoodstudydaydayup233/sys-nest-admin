import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleInfo {
  @ApiProperty({ description: '角色ID' })
  id: number;

  @ApiProperty({ description: '角色名称' })
  name: string;
}

export class UserInfoDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiPropertyOptional({ description: '昵称' })
  nickname?: string;

  @ApiPropertyOptional({ description: '头像' })
  avatar?: string;

  @ApiPropertyOptional({ description: '角色列表', type: [RoleInfo] })
  roles?: RoleInfo[];

  @ApiPropertyOptional({ description: '权限标识列表', type: [String] })
  permissions?: string[];
}
