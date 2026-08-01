import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 定时任务视图对象
 */
export class JobVo {
  @ApiProperty({ description: '任务ID' })
  jobId: number;

  @ApiProperty({ description: '任务名称' })
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  invokeTarget: string;

  @ApiProperty({ description: 'cron执行表达式' })
  cronExpression: string;

  @ApiProperty({ description: '计划执行错误策略: 1-立即执行 2-执行一次 3-放弃执行' })
  misfirePolicy: string;

  @ApiProperty({ description: '是否并发执行: 0-允许 1-禁止' })
  concurrent: string;

  @ApiProperty({ description: '状态: 0-正常 1-暂停' })
  status: string;

  @ApiPropertyOptional({ description: '下次执行时间' })
  nextValidTime?: Date | null;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: '更新时间' })
  updatedAt?: Date;
}

/**
 * 定时任务列表视图对象
 */
export class JobListVo {
  @ApiProperty({ type: [JobVo], description: '列表数据' })
  list: JobVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
