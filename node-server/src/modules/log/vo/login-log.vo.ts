import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 登录日志视图对象
 * @description SysLogininforVo
 */
export class LoginLogVo {
  @ApiProperty({ description: '访问ID' })
  id: number;

  @ApiProperty({ description: '用户账号' })
  userName: string;

  @ApiPropertyOptional({ description: '登录IP地址' })
  ipaddr?: string;

  @ApiPropertyOptional({ description: '登录地点' })
  loginLocation?: string;

  @ApiPropertyOptional({ description: '浏览器类型' })
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统' })
  os?: string;

  @ApiProperty({ description: '登录状态: 0-成功 1-失败' })
  status: string;

  @ApiPropertyOptional({ description: '提示消息' })
  msg?: string;

  @ApiProperty({ description: '登录时间' })
  loginTime: Date;
}

export class LoginLogListVo {
  list: LoginLogVo[];
  total: number;
  page: number;
  pageSize: number;
}
