import { Module } from '@nestjs/common';
import { FileLogService } from './file-log.service';
import { FileLogController } from './file-log.controller';

/**
 * 文件日志查询模块
 * @description 提供文件日志的读取接口：
 * - GET  /file-log/files      日志文件列表
 * - GET  /file-log/entries    日志内容查询（分类/级别/时间/关键字筛选 + 分页）
 * - GET  /file-log/raw        日志文件原始内容预览（按行分页）
 * - GET  /file-log/download   日志文件下载
 * - DELETE /file-log/file     日志文件删除
 *
 * 写入能力由全局 FileLoggerModule 提供（FileLoggerService）。
 */
@Module({
  controllers: [FileLogController],
  providers: [FileLogService],
  exports: [FileLogService],
})
export class FileLogModule {}
