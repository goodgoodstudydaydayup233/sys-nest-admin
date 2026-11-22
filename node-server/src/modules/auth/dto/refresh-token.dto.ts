import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新Token' })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken不能为空' })
  refreshToken: string;
}
