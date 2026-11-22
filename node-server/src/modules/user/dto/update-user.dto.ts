import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {
  @ApiProperty({ description: '昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;
}
