import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 通知公告实体
 * @description 对应 sys_notice 表
 *
 * @字段说明
 * - noticeTitle: 通知标题
 * - noticeType:  通知类型（1-通知 2-公告）
 * - noticeContent: 通知内容（富文本，可含 HTML）
 * - status:      状态（0-正常 1-关闭）
 * - createBy:    创建者（继承自 BaseEntity 的 createdBy）
 */
@Entity('sys_notice')
export class Notice extends BaseEntity {
  @Column({ length: 50, comment: '通知标题' })
  noticeTitle: string;

  @Column({ type: 'char', length: 1, comment: '通知类型: 1-通知 2-公告' })
  noticeType: string;

  @Column({ type: 'text', nullable: true, comment: '通知内容' })
  noticeContent: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '状态: 0-正常 1-关闭' })
  status: string;
}
