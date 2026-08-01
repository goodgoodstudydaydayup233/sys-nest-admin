import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

export class UpdateUserFormDto extends UpdateUserDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: '头像文件' })
  avatarFile?: Express.Multer.File;
}
