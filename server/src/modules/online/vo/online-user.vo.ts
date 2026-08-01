import { ApiProperty } from '@nestjs/swagger';

/**
 * 在线用户视图对象
 * @description 展示当前登录中的用户信息
 *
 * @字段说明
 * - tokenId: access token（作为唯一标识，用于强退）
 * - username/nickname: 用户账号与昵称
 * - ipaddr: 登录 IP
 * - browser/os: 浏览器与操作系统（由 User-Agent 解析）
 * - loginTime: 登录时间（ISO 字符串）
 */
export class OnlineUserVo {
  @ApiProperty({ description: 'access token（强退时作为参数传入）', example: 'eyJhbGciOiJI...' })
  tokenId: string;

  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '昵称' })
  nickname: string;

  @ApiProperty({ description: '登录 IP' })
  ipaddr: string;

  @ApiProperty({ description: '浏览器' })
  browser: string;

  @ApiProperty({ description: '操作系统' })
  os: string;

  @ApiProperty({ description: '登录时间（ISO 字符串）' })
  loginTime: string;
}
