import { Global, Module } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';

/**
 * 文件日志模块
 * @description 全局模块，提供 FileLoggerService 文件日志能力：
 * - 支持 access/app/error 三类日志的按天 + 按大小滚动写入
 * - 实现 Nest LoggerService，供 app.useLogger() 接管框架日志
 *
 * @使用示例
 * ```ts
 * // 任意模块注入（全局模块无需 import）
 * constructor(private readonly logger: FileLoggerService) {}
 * ```
 */
@Global()
@Module({
  providers: [FileLoggerService],
  exports: [FileLoggerService],
})
export class FileLoggerModule {}
