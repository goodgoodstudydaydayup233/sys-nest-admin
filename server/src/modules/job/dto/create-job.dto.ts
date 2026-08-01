import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建定时任务 DTO
 *
 * @example
 * ```ts
 * {
 *   jobName: '系统默认（无参）',
 *   jobGroup: 'DEFAULT',
 *   invokeTarget: "ryTask.ryNoParams()",
 *   cronExpression: '0/10 * * * * ?',
 *   misfirePolicy: '3',
 *   concurrent: '1',
 *   status: '0',
 *   remark: '示例任务'
 * }
 * ```
 */
export class CreateJobDto {
  @ApiProperty({ description: '任务名称', maxLength: 64 })
  @IsString()
  @IsNotEmpty({ message: '任务名称不能为空' })
  jobName: string;

  @ApiProperty({ description: '任务组名', default: 'DEFAULT' })
  @IsString()
  @IsOptional()
  jobGroup?: string;

  @ApiProperty({ description: "调用目标字符串，如 ryTask.ryParams('ry')" })
  @IsString()
  @IsNotEmpty({ message: '调用目标字符串不能为空' })
  invokeTarget: string;

  @ApiProperty({ description: 'cron执行表达式' })
  @IsString()
  @IsNotEmpty({ message: 'cron执行表达式不能为空' })
  cronExpression: string;

  @ApiProperty({ description: '计划执行错误策略: 1-立即执行 2-执行一次 3-放弃执行', default: '3' })
  @IsString()
  @IsOptional()
  @IsIn(['1', '2', '3'], { message: '执行策略只能为 1/2/3' })
  misfirePolicy?: string;

  @ApiProperty({ description: '是否并发执行: 0-允许 1-禁止', default: '1' })
  @IsString()
  @IsOptional()
  @IsIn(['0', '1'], { message: '是否并发只能为 0/1' })
  concurrent?: string;

  @ApiProperty({ description: '状态: 0-正常 1-暂停', default: '0' })
  @IsString()
  @IsOptional()
  @IsIn(['0', '1'], { message: '状态只能为 0/1' })
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
