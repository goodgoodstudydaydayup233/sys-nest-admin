import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '../../../common/dto/base.dto';

/**
 * 查询通知公告 DTO
 * @description 对标若依 SysNoticeBo 查询条件
 *
 * @使用示例
 * GET /system/notice?page=1&pageSize=10&noticeTitle=维护&noticeType=1
 */
export class QueryNoticeDto extends BasePaginationDto {
  @ApiPropertyOptional({ description: '通知标题（模糊匹配）' })
  @IsString()
  @IsOptional()
  noticeTitle?: string;

  @ApiPropertyOptional({ description: '创建者（模糊匹配）' })
  @IsString()
  @IsOptional()
  createBy?: string;

  @ApiPropertyOptional({ description: '通知类型: 1-通知 2-公告' })
  @IsString()
  @IsIn(['1', '2'])
  @IsOptional()
  noticeType?: string;
}
