import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateProfileDto } from './update-profile.dto';

export class UpdateProfileFormDto extends UpdateProfileDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: '头像文件' })
  avatarFile?: Express.Multer.File;
}
