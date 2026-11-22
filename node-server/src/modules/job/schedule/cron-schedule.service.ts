import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';

/**
 * Cron 调度服务
 * @description 基于 cron 库自行管理 CronJob 实例，提供动态增删改查能力。
 * 每个任务以 jobId 为 key 存储，支持启动时加载、CRUD 同步、立即执行、下次时间计算。
 *
 * @example
 * ```ts
 * this.cronScheduleService.addJob(jobId, '0/10 * * * * ?', () => this.run(jobId));
 * const next = this.cronScheduleService.getNextValidTime('0/10 * * * * ?');
 * ```
 */
@Injectable()
export class CronScheduleService {
  private readonly logger = new Logger(CronScheduleService.name);
  private readonly jobs = new Map<number, CronJob>();

  /** 添加并启动 cron 任务 */
  addJob(jobId: number, cronExpression: string, onTick: () => void): void {
    if (this.jobs.has(jobId)) {
      this.removeJob(jobId);
    }
    const cron = this.normalize(cronExpression);
    const job = new CronJob(cron, onTick);
    job.start();
    this.jobs.set(jobId, job);
    this.logger.log(`定时任务已注册: jobId=${jobId}, cron=${cron}`);
  }

  /** 移除任务 */
  removeJob(jobId: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
    }
  }

  /** 更新任务表达式（先移除再添加） */
  updateJob(jobId: number, cronExpression: string, onTick: () => void): void {
    this.removeJob(jobId);
    this.addJob(jobId, cronExpression, onTick);
  }

  /** 判断任务是否存在 */
  hasJob(jobId: number): boolean {
    return this.jobs.has(jobId);
  }

  /** 校验 cron 表达式是否合法 */
  validate(cronExpression: string): boolean {
    try {
      new CronJob(this.normalize(cronExpression), () => {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 归一化 cron 表达式
   * @description 兼容 Quartz 风格的 `?`（表示不指定），node-cron 不支持该符号，统一替换为 `*`
   */
  private normalize(cronExpression: string): string {
    return cronExpression.replace(/\?/g, '*');
  }

  /**
   * 获取 cron 表达式下次执行时间
   * @returns Date 或 null（表达式非法时）
   */
  getNextValidTime(cronExpression: string): Date | null {
    try {
      const job = new CronJob(this.normalize(cronExpression), () => {});
      return job.nextDate().toJSDate();
    } catch {
      return null;
    }
  }

  /** 停止并清空所有任务 */
  clear(): void {
    for (const [, job] of this.jobs) job.stop();
    this.jobs.clear();
  }
}
