import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo } from '../../../common/vo/base.vo';

/**
 * 站内信视图对象
 * @description SysMessageVo
 */
export class MessageVo extends BaseVo {
  @ApiProperty({ description: '发送者用户名（system 表示系统发送）' })
  senderName: string;

  @ApiProperty({ description: '接收用户ID' })
  receiverId: number;

  @ApiProperty({ description: '接收用户名' })
  receiverName: string;

  @ApiProperty({ description: '消息标题' })
  title: string;

  @ApiPropertyOptional({ description: '消息内容' })
  content?: string;

  @ApiProperty({ description: '消息类型: 1-系统通知 2-业务提醒 3-任务结果' })
  type: string;

  @ApiProperty({ description: '状态: 0-未读 1-已读' })
  status: string;

  @ApiPropertyOptional({ description: '读取时间' })
  readAt?: Date;
}

/**
 * 站内信列表分页 VO
 */
export class MessageListVo {
  @ApiProperty({ description: '列表数据', type: [MessageVo] })
  list: MessageVo[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;
}

/**
 * 未读数量 VO
 */
export class UnreadCountVo {
  @ApiProperty({ description: '未读数量' })
  count: number;
}
