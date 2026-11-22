import { IsString, IsOptional, IsEmail, IsMobilePhone, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

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

  @ApiPropertyOptional({ description: '性别: 0-男 1-女 3-未知' })
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional({ description: '头像' })
  @IsString()
  @IsOptional()
  avatar?: string;
}