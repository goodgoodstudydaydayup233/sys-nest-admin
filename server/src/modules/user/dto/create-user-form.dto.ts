import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class CreateUserFormDto extends CreateUserDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: '头像文件' })
  avatarFile?: Express.Multer.File;
}
