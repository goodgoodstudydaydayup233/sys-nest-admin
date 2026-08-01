import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysJob } from './entities/sys-job.entity';
import { SysJobLog } from './entities/sys-job-log.entity';
import { JobRepository } from './repository/job.repository';
import { JobLogRepository } from './repository/job-log.repository';
import { CronScheduleService } from './schedule/cron-schedule.service';
import { SampleTask } from './schedule/sample-task';
import { JobService } from './job.service';
import { JobLogService } from './job-log.service';
import { JobController } from './job.controller';
import { JobLogController } from './job-log.controller';

/**
 * 定时任务模块
 * @description 提供动态 cron 调度、任务管理与调度日志
 *
 * @example
 * 示例任务调用目标：
 * - ryTask.ryNoParams()
 * - ryTask.ryParams('ry')
 * - ryTask.ryMultipleParams('ry', 1, true)
 */
@Module({
  imports: [TypeOrmModule.forFeature([SysJob, SysJobLog])],
  controllers: [JobController, JobLogController],
  providers: [
    JobRepository,
    JobLogRepository,
    CronScheduleService,
    JobService,
    JobLogService,
    SampleTask,
    // 以 beanName 作为 token 注册，供 invokeTarget 解析调用
    { provide: 'ryTask', useClass: SampleTask },
  ],
})
export class JobModule {}
