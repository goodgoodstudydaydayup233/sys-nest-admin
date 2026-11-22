import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

/**
 * 更新定时任务 DTO（继承自创建 DTO，所有字段可选）
 */
export class UpdateJobDto extends PartialType(CreateJobDto) {}
