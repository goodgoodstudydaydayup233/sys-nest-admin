import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 定时任务实体（对标若依 sys_job）
 */
@Entity('sys_job')
export class SysJob extends BaseEntity {
  @Column({ length: 64, comment: '任务名称' })
  jobName: string;

  @Column({ length: 64, default: 'DEFAULT', comment: '任务组名' })
  jobGroup: string;

  @Column({ length: 500, comment: '调用目标字符串' })
  invokeTarget: string;

  @Column({ length: 255, comment: 'cron执行表达式' })
  cronExpression: string;

  @Column({ length: 20, default: '3', comment: '计划执行错误策略: 1-立即执行 2-执行一次 3-放弃执行' })
  misfirePolicy: string;

  @Column({ type: 'char', length: 1, default: '1', comment: '是否并发执行: 0-允许 1-禁止' })
  concurrent: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '状态: 0-正常 1-暂停' })
  status: string;

  @Column({ type: 'datetime', nullable: true, comment: '下次执行时间' })
  nextValidTime: Date | null;

  @Column({ length: 500, nullable: true, comment: '备注' })
  remark: string;
}
