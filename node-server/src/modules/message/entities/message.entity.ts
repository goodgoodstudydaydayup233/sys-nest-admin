import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 站内信实体
 * @description 对应 sys_message 表
 *
 * @设计说明
 * - 采用「冗余存储」模型：每条消息按「接收用户」各存一条记录（含发送者/接收者冗余字段），
 *   查询收件箱时无需联表，性能最佳；后台管理系统用户量有限，冗余成本可接受。
 * - 全员发送（不指定接收人）时，为每个启用用户批量生成一条记录。
 *
 * @字段说明
 * - senderName:  发送者用户名（'system' 表示系统自动发送）
 * - receiverId:  接收用户 ID
 * - receiverName: 接收用户名（冗余，避免展示时联表）
 * - title:       消息标题
 * - content:     消息内容
 * - type:        消息类型：1-系统通知 2-业务提醒 3-任务结果
 * - status:      状态：0-未读 1-已读
 * - readAt:      读取时间（未读时为 NULL）
 */
@Entity('sys_message')
@Index(['receiverId', 'deleteStatus'])
@Index(['receiverId', 'status'])
export class Message extends BaseEntity {
  @Column({ length: 50, comment: '发送者用户名' })
  senderName: string;

  @Column({ comment: '接收用户ID' })
  receiverId: number;

  @Column({ length: 50, comment: '接收用户名' })
  receiverName: string;

  @Column({ length: 100, comment: '消息标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '消息内容' })
  content: string;

  @Column({ type: 'char', length: 1, default: '1', comment: '消息类型: 1-系统通知 2-业务提醒 3-任务结果' })
  type: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '状态: 0-未读 1-已读' })
  status: string;

  @Column({ type: 'datetime', nullable: true, comment: '读取时间' })
  readAt: Date;
}
