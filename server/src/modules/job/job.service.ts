import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JobRepository } from './repository/job.repository';
import { JobLogRepository } from './repository/job-log.repository';
import { CronScheduleService } from './schedule/cron-schedule.service';
import { QueryJobDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobVo, JobListVo } from './vo/job.vo';
import { SysJob } from './entities/sys-job.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

/**
 * 定时任务服务
 * @description 提供任务 CRUD、动态调度同步、立即执行、
 * 状态切换、调用目标解析执行、并发控制与调度日志记录。
 *
 * @调度策略
 * - 启动时（OnModuleInit）加载所有 status=0 的任务注册到 cron 调度器
 * - CRUD 操作同步调度器：新增/启用→注册，修改→更新，删除/暂停→移除
 * - misfirePolicy：1-启动立即执行一次，2-执行一次后停止，3-按 cron 正常调度
 * - concurrent=1（禁止）时，运行中跳过本次触发
 *
 * @调用目标格式
 * `beanName.method(arg1, arg2, ...)`，参数支持 string/number/boolean，如 `stTask.stParams('st')`
 */
@Injectable()
export class JobService implements OnModuleInit {
  private readonly logger = new Logger(JobService.name);
  /** 运行中的任务ID集合，用于禁止并发 */
  private readonly runningJobs = new Set<number>();

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobLogRepository: JobLogRepository,
    private readonly cronScheduleService: CronScheduleService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /** 应用启动时加载所有可运行任务 */
  async onModuleInit(): Promise<void> {
    try {
      const jobs = await this.jobRepository.findRunnable();
      for (const job of jobs) {
        this.scheduleJob(job);
      }
      this.logger.log(`定时任务调度器初始化完成，共加载 ${jobs.length} 个任务`);
    } catch (e) {
      this.logger.error(`定时任务调度器初始化失败: ${e instanceof Error ? e.message : e}`);
    }
  }

  async findById(id: number): Promise<JobVo | null> {
    const job = await this.jobRepository.findById(id);
    return job ? this.toJobVo(job) : null;
  }

  async findAll(query: QueryJobDto): Promise<JobListVo> {
    const { list, total } = await this.jobRepository.findAll(query);
    return { list: list.map((j) => this.toJobVo(j)), total };
  }

  async create(dto: CreateJobDto, username?: string): Promise<JobVo> {
    if (!this.cronScheduleService.validate(dto.cronExpression)) {
      throw new BusinessException('cron表达式不合法', ErrorCodeEnum.JOB_CRON_INVALID);
    }
    this.validateInvokeTarget(dto.invokeTarget);

    const nextValidTime = dto.status === '0'
      ? this.cronScheduleService.getNextValidTime(dto.cronExpression)
      : null;

    const job = await this.jobRepository.create({
      jobName: dto.jobName,
      jobGroup: dto.jobGroup || 'DEFAULT',
      invokeTarget: dto.invokeTarget,
      cronExpression: dto.cronExpression,
      misfirePolicy: dto.misfirePolicy || '3',
      concurrent: dto.concurrent || '1',
      status: dto.status || '0',
      nextValidTime,
      remark: dto.remark,
      createdBy: username,
    });

    // 状态正常则注册调度
    if (job.status === '0') {
      this.scheduleJob(job);
    }
    return this.toJobVo(job);
  }

  async update(id: number, dto: UpdateJobDto, username?: string): Promise<JobVo | null> {
    const before = await this.jobRepository.findById(id);
    if (!before) {
      throw new BusinessException('定时任务不存在', ErrorCodeEnum.JOB_NOT_FOUND);
    }

    if (dto.cronExpression && !this.cronScheduleService.validate(dto.cronExpression)) {
      throw new BusinessException('cron表达式不合法', ErrorCodeEnum.JOB_CRON_INVALID);
    }
    if (dto.invokeTarget) {
      this.validateInvokeTarget(dto.invokeTarget);
    }

    const status = dto.status ?? before.status;
    const cronExpression = dto.cronExpression ?? before.cronExpression;
    const nextValidTime = status === '0'
      ? this.cronScheduleService.getNextValidTime(cronExpression)
      : null;

    const job = await this.jobRepository.update(id, {
      ...dto,
      nextValidTime,
      updatedBy: username,
    });

    // 同步调度器
    if (status === '0') {
      // 重新注册（覆盖旧闭包，确保使用最新配置）
      this.scheduleJob(job!);
    } else {
      // 暂停则移除调度
      this.cronScheduleService.removeJob(id);
    }

    return job ? this.toJobVo(job) : null;
  }

  async remove(id: number): Promise<void> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new BusinessException('定时任务不存在', ErrorCodeEnum.JOB_NOT_FOUND);
    }
    this.cronScheduleService.removeJob(id);
    await this.jobRepository.remove(id);
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  /** 修改任务状态（启用/暂停） */
  async changeStatus(jobId: number, status: string, username?: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new BusinessException('定时任务不存在', ErrorCodeEnum.JOB_NOT_FOUND);
    }
    const nextValidTime = status === '0'
      ? this.cronScheduleService.getNextValidTime(job.cronExpression)
      : null;

    await this.jobRepository.update(jobId, { status, nextValidTime, updatedBy: username });

    if (status === '0') {
      this.scheduleJob(job);
    } else {
      this.cronScheduleService.removeJob(jobId);
    }
  }

  /** 立即执行一次（手动触发，不受并发限制，记录日志） */
  async run(jobId: number): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new BusinessException('定时任务不存在', ErrorCodeEnum.JOB_NOT_FOUND);
    }
    await this.executeJob(job, true);
  }

  // ==================== 调度内部逻辑 ====================

  /** 注册任务到调度器 */
  private scheduleJob(job: SysJob): void {
    if (job.status !== '0') return;
    const onTick = (): void => {
      this.executeJob(job, false).catch((e) => {
        this.logger.error(`任务[${job.jobName}]执行异常: ${e instanceof Error ? e.message : e}`);
      });
    };
    this.cronScheduleService.addJob(job.id, job.cronExpression, onTick);

    // misfirePolicy 处理
    if (job.misfirePolicy === '1') {
      // 立即执行：启动后补执行一次
      onTick();
    } else if (job.misfirePolicy === '2') {
      // 执行一次：触发一次后移除调度
      onTick();
      this.cronScheduleService.removeJob(job.id);
    }
  }

  /**
   * 执行任务：解析 invokeTarget 调用 bean 方法，记录调度日志
   * @param job 任务实体（快照）
   * @param isManual 是否手动触发
   */
  private async executeJob(job: SysJob, isManual: boolean): Promise<void> {
    // 并发禁止（手动触发不限制）
    if (!isManual && job.concurrent === '1' && this.runningJobs.has(job.id)) {
      this.logger.warn(`任务[${job.jobName}]正在执行，跳过本次触发`);
      return;
    }
    this.runningJobs.add(job.id);

    let status = '0';
    let jobMessage = '';
    let exceptionInfo: string | null = null;

    try {
      const result = await this.invokeMethod(job.invokeTarget);
      jobMessage = result;
    } catch (e) {
      status = '1';
      jobMessage = '执行失败';
      exceptionInfo = e instanceof Error ? e.stack || e.message : String(e);
      this.logger.error(`任务[${job.jobName}]执行失败: ${exceptionInfo}`);
    } finally {
      this.runningJobs.delete(job.id);
    }

    await this.jobLogRepository.create({
      jobName: job.jobName,
      jobGroup: job.jobGroup,
      invokeTarget: job.invokeTarget,
      jobMessage: isManual ? `手动触发：${jobMessage}` : jobMessage,
      status,
      exceptionInfo,
    });
  }

  /**
   * 解析并调用目标方法
   * @example
   * invokeMethod("stTask.stParams('st')") → 调用 stTask.stParams('st')
   */
  private async invokeMethod(invokeTarget: string): Promise<string> {
    const match = invokeTarget.match(/^(\w+)\.(\w+)\((.*)\)$/);
    if (!match) {
      throw new BusinessException('调用目标字符串格式错误，应为 beanName.method(args)', ErrorCodeEnum.PARAM_ERROR);
    }
    const [, beanName, methodName, argsStr] = match;

    let bean: any;
    try {
      bean = this.moduleRef.get(beanName, { strict: false });
    } catch {
      throw new BusinessException(`任务Bean[${beanName}]不存在`, ErrorCodeEnum.JOB_BEAN_NOT_FOUND);
    }
    if (!bean) {
      throw new BusinessException(`任务Bean[${beanName}]不存在`, ErrorCodeEnum.JOB_BEAN_NOT_FOUND);
    }

    const fn = bean[methodName];
    if (typeof fn !== 'function') {
      throw new BusinessException(`任务方法[${methodName}]不存在`, ErrorCodeEnum.JOB_METHOD_NOT_FOUND);
    }

    const args = this.parseArgs(argsStr);
    const result = await fn.apply(bean, args);
    return result !== undefined && result !== null ? String(result) : '执行成功';
  }

  /** 解析参数字符串为参数数组，支持 string/number/boolean */
  private parseArgs(argsStr: string): any[] {
    const trimmed = argsStr.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map((a) => {
      const s = a.trim();
      if (/^['"].*['"]$/.test(s)) return s.slice(1, -1);
      if (s === 'true') return true;
      if (s === 'false') return false;
      if (/^-?\d+$/.test(s)) return parseInt(s, 10);
      if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
      return s;
    });
  }

  /** 校验调用目标字符串格式 */
  private validateInvokeTarget(invokeTarget: string): void {
    if (!/^(\w+)\.(\w+)\((.*)\)$/.test(invokeTarget)) {
      throw new BusinessException('调用目标字符串格式错误，应为 beanName.method(args)', ErrorCodeEnum.PARAM_ERROR);
    }
  }

  private toJobVo(job: SysJob): JobVo {
    return {
      jobId: job.id,
      jobName: job.jobName,
      jobGroup: job.jobGroup,
      invokeTarget: job.invokeTarget,
      cronExpression: job.cronExpression,
      misfirePolicy: job.misfirePolicy,
      concurrent: job.concurrent,
      status: job.status,
      nextValidTime: job.nextValidTime,
      remark: job.remark,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
