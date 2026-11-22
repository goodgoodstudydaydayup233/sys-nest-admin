import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseVo, BaseListVo } from '../../../common/vo/base.vo';

/**
 * 操作日志视图对象
 * @description SysOperLogVo
 */
export class LogVo extends BaseVo {
  @ApiProperty({ description: '模块标题' })
  title: string;

  @ApiProperty({ description: '业务类型: 0-其它 1-新增 2-修改 3-删除' })
  businessType: string;

  @ApiProperty({ description: '方法名称' })
  method: string;

  @ApiProperty({ description: '请求方式' })
  requestMethod: string;

  @ApiProperty({ description: '操作人员' })
  operName: string;

  @ApiProperty({ description: '请求URL' })
  operUrl: string;

  @ApiPropertyOptional({ description: '主机地址' })
  operIp?: string;

  @ApiPropertyOptional({ description: '操作地点' })
  operLocation?: string;

  @ApiPropertyOptional({ description: '请求参数' })
  operParam?: string;

  @ApiPropertyOptional({ description: '返回参数' })
  jsonResult?: string;

  @ApiProperty({ description: '操作状态: 0-正常 1-异常' })
  status: string;

  @ApiPropertyOptional({ description: '错误消息' })
  errorMsg?: string;

  @ApiPropertyOptional({ description: '消耗时间(ms)' })
  costTime?: number;
}

export class LogListVo extends BaseListVo<LogVo> {}
