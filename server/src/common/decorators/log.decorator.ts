import { SetMetadata } from '@nestjs/common';
import { BusinessType } from '../enums/business-type.enum';

/**
 * @Log 装饰器元数据 key
 */
export const LOG_METADATA_KEY = 'log:metadata';

/**
 * @Log 装饰器元数据结构
 */
export interface LogMetadata {
  /** 模块标题，如"用户管理" */
  title: string;
  /** 业务类型，默认其它 */
  businessType: BusinessType;
}

/**
 * 操作日志装饰器
 * @description 对标若依 @Log 注解，标注在 Controller 方法上，由全局 LoggingInterceptor 拦截记录操作日志。
 * 只有标注了 @Log 的接口才会被记录，避免日志量过大。
 *
 * @param title 模块标题，如"用户管理"
 * @param businessType 业务类型，默认 BusinessType.OTHER
 *
 * @使用示例
 * ```ts
 * @Log('用户管理', BusinessType.INSERT)
 * @Post()
 * async create(@Body() dto: CreateUserDto) { ... }
 *
 * @Log('用户管理', BusinessType.DELETE)
 * @Delete(':id')
 * async remove(@Param('id') id: number) { ... }
 * ```
 */
export const Log = (title: string, businessType: BusinessType = BusinessType.OTHER) =>
  SetMetadata(LOG_METADATA_KEY, { title, businessType } as LogMetadata);
