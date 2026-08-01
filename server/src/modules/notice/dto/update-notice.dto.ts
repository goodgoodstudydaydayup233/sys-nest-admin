import { PartialType } from '@nestjs/swagger';
import { CreateNoticeDto } from './create-notice.dto';

/** 更新通知公告 DTO（所有字段可选） */
export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}
