import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建通知公告 DTO
 * @description 对标若依 SysNoticeBo
 *
 * @使用示例
 * POST /system/notice
 * {
 *   "noticeTitle": "系统维护通知",
 *   "noticeType": "1",
 *   "noticeContent": "<p>将于今晚 22:00 进行系统维护</p>",
 *   "status": "0"
 * }
 */
export class CreateNoticeDto {
  @ApiProperty({ description: '通知标题' })
  @IsString()
  @IsNotEmpty({ message: '通知标题不能为空' })
  noticeTitle: string;

  @ApiProperty({ description: '通知类型: 1-通知 2-公告' })
  @IsString()
  @IsIn(['1', '2'], { message: '通知类型只能为 1-通知 或 2-公告' })
  noticeType: string;

  @ApiPropertyOptional({ description: '通知内容（富文本）' })
  @IsString()
  @IsOptional()
  noticeContent?: string;

  @ApiPropertyOptional({ description: '状态: 0-正常 1-关闭', default: '0' })
  @IsString()
  @IsIn(['0', '1'], { message: '状态只能为 0-正常 或 1-关闭' })
  @IsOptional()
  status?: string;
}
