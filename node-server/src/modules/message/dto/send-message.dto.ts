import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 发送站内信参数
 * @description 支持定向发送（指定接收人）与全员发送（不传 receiverIds）
 *
 * @example
 * ```json
 * {
 *   "title": "定时任务执行失败",
 *   "type": "3",
 *   "content": "任务 xxx 执行失败，请检查。",
 *   "receiverIds": [1, 2]
 * }
 * ```
 *
 * @业务规则
 * - receiverIds 为空或未传时表示发送给全部启用用户
 * - 不允许接收人包含自己以外无关的过滤逻辑（由调用方控制权限）
 */
export class SendMessageDto {
  @ApiProperty({ description: '消息标题' })
  @IsString()
  @IsNotEmpty({ message: '消息标题不能为空' })
  @MaxLength(100, { message: '消息标题不能超过 100 个字符' })
  title: string;

  @ApiProperty({ description: '消息类型: 1-系统通知 2-业务提醒 3-任务结果', default: '1' })
  @IsString()
  @IsIn(['1', '2', '3'], { message: '消息类型仅支持 1-系统通知 / 2-业务提醒 / 3-任务结果' })
  type: string;

  @ApiPropertyOptional({ description: '消息内容' })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: '消息内容不能超过 2000 个字符' })
  content?: string;

  @ApiPropertyOptional({
    description: '接收用户 ID 列表（为空或未传时发送给全部启用用户）',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true, message: '接收用户 ID 必须为数字' })
  receiverIds?: number[];
}
