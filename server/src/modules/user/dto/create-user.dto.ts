import { IsString, IsNotEmpty, IsOptional, IsEmail, IsMobilePhone, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiPropertyOptional({ description: '密码（不传则使用系统默认密码 sys.user.defaultPassword）' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: '密码长度不能小于6位' })
  password?: string;

  @ApiProperty({ description: '昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @ValidateIf((o) => o.phone !== '' && o.phone != null)
  @IsMobilePhone('zh-CN', {}, { message: '手机号格式不正确' })
  @IsOptional()
  phone?: string;

  @ApiHideProperty()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-启用', default: '1' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '性别: 0-男 1-女 3-未知', default: '3' })
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '角色ID列表', type: [Number] })
  @IsOptional()
  roleIds?: number[];
}
