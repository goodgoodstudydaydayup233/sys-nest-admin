import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 定时任务调度日志视图对象
 */
export class JobLogVo {
  @ApiProperty({ description: '日志ID' })
  jobLogId: number;

  @ApiProperty({ description: '任务名称' })
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  invokeTarget: string;

  @ApiPropertyOptional({ description: '日志信息' })
  jobMessage?: string;

  @ApiProperty({ description: '执行状态: 0-成功 1-失败' })
  status: string;

  @ApiPropertyOptional({ description: '异常信息' })
  exceptionInfo?: string | null;

  @ApiProperty({ description: '执行时间' })
  createTime: Date;
}

/**
 * 定时任务调度日志列表视图对象
 */
export class JobLogListVo {
  @ApiProperty({ type: [JobLogVo], description: '列表数据' })
  list: JobLogVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
