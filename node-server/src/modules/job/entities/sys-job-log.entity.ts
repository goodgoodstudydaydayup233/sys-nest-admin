import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * 定时任务调度日志实体（对应 sys_job_log）
 * @description 日志直接物理管理（删除/清空），无需软删除字段
 */
@Entity('sys_job_log')
export class SysJobLog {
  @PrimaryGeneratedColumn({ comment: '日志ID' })
  jobLogId: number;

  @Column({ length: 64, comment: '任务名称' })
  jobName: string;

  @Column({ length: 64, comment: '任务组名' })
  jobGroup: string;

  @Column({ length: 500, comment: '调用目标字符串' })
  invokeTarget: string;

  @Column({ length: 500, nullable: true, comment: '日志信息' })
  jobMessage: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '执行状态: 0-成功 1-失败' })
  status: string;

  @Column({ type: 'text', nullable: true, comment: '异常信息' })
  exceptionInfo: string | null;

  @CreateDateColumn({ comment: '执行时间' })
  createTime: Date;
}
