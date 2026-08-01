import { Injectable } from '@nestjs/common';
import { JobLogRepository } from './repository/job-log.repository';
import { QueryJobLogDto } from './dto/query-job-log.dto';
import { JobLogVo, JobLogListVo } from './vo/job-log.vo';
import { SysJobLog } from './entities/sys-job-log.entity';

/**
 * 定时任务调度日志服务
 * @description 提供调度日志的查询、详情、批量删除、清空等操作
 */
@Injectable()
export class JobLogService {
  constructor(private readonly jobLogRepository: JobLogRepository) {}

  async findById(id: number): Promise<JobLogVo | null> {
    const log = await this.jobLogRepository.findById(id);
    return log ? this.toJobLogVo(log) : null;
  }

  async findAll(query: QueryJobLogDto): Promise<JobLogListVo> {
    const { list, total } = await this.jobLogRepository.findAll(query);
    return { list: list.map((l) => this.toJobLogVo(l)), total };
  }

  async remove(ids: number[]): Promise<void> {
    await this.jobLogRepository.remove(ids);
  }

  async cleanAll(): Promise<void> {
    await this.jobLogRepository.cleanAll();
  }

  private toJobLogVo(log: SysJobLog): JobLogVo {
    return {
      jobLogId: log.jobLogId,
      jobName: log.jobName,
      jobGroup: log.jobGroup,
      invokeTarget: log.invokeTarget,
      jobMessage: log.jobMessage,
      status: log.status,
      exceptionInfo: log.exceptionInfo,
      createTime: log.createTime,
    };
  }
}
