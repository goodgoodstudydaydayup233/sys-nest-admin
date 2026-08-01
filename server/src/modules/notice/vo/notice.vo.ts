import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

/**
 * 通知公告视图对象
 * @description 对标若依 SysNoticeVo
 */
export class NoticeVo extends BaseVo {
  @ApiProperty({ description: '通知标题' })
  noticeTitle: string;

  @ApiProperty({ description: '通知类型: 1-通知 2-公告' })
  noticeType: string;

  @ApiPropertyOptional({ description: '通知内容（富文本）' })
  noticeContent?: string;

  @ApiProperty({ description: '状态: 0-正常 1-关闭' })
  status: string;

  @ApiPropertyOptional({ description: '创建者' })
  createBy?: string;
}

/**
 * 通知公告列表分页 VO
 */
export class NoticeListVo {
  @ApiProperty({ description: '列表数据', type: [NoticeVo] })
  list: NoticeVo[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;
}
