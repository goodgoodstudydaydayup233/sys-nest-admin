import { Body, Controller, Delete, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { FileLogService } from './file-log.service';
import {
  QueryFileLogEntriesDto,
  QueryFileLogFilesDto,
  QueryFileLogRawDto,
  RemoveFileLogDto,
} from './dto/query-file-log.dto';
import { FileLogEntriesVo, FileLogFilesVo, FileLogRawVo } from './vo/file-log.vo';

/**
 * 文件日志控制器
 * @description 提供文件日志的查看能力，所有接口需登录且具备对应权限。
 *
 * @路由前缀 /{dev-api|prod-api}/file-log
 * @接口列表
 * - GET    /file-log/files      获取日志文件列表（按分类，分页）
 * - GET    /file-log/entries    查询日志内容（分类/级别/时间/关键字筛选 + 分页）
 * - GET    /file-log/raw        预览日志文件原始内容（按行分页）
 * - GET    /file-log/download   下载单个日志文件
 * - DELETE /file-log/file       删除单个日志文件
 */
@ApiTags('文件日志')
@Controller('file-log')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileLogController {
  constructor(private readonly fileLogService: FileLogService) {}

  @Get('files')
  @ApiOperation({ summary: '获取日志文件列表' })
  @ApiResponse({ status: 200, description: '成功', type: FileLogFilesVo })
  @Permission('monitor:fileLog:list')
  async listFiles(@Query() query: QueryFileLogFilesDto): Promise<FileLogFilesVo> {
    return this.fileLogService.listFiles(query);
  }

  @Get('entries')
  @ApiOperation({ summary: '查询日志内容' })
  @ApiResponse({ status: 200, description: '成功', type: FileLogEntriesVo })
  @Permission('monitor:fileLog:query')
  async getEntries(@Query() query: QueryFileLogEntriesDto): Promise<FileLogEntriesVo> {
    return this.fileLogService.readEntries(query);
  }

  @Get('raw')
  @ApiOperation({ summary: '预览日志文件原始内容（按行分页）' })
  @ApiResponse({ status: 200, description: '成功', type: FileLogRawVo })
  @Permission('monitor:fileLog:query')
  async getRaw(@Query() query: QueryFileLogRawDto): Promise<FileLogRawVo> {
    return this.fileLogService.readRaw(query);
  }

  @Get('download')
  @ApiOperation({ summary: '下载日志文件' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:fileLog:download')
  async download(@Query('name') name: string, @Res() res: Response): Promise<void> {
    const category = this.parseCategory(name);
    const filePath = this.fileLogService.resolveFilePath(name, category);
    res.download(filePath, name);
  }

  @Delete('file')
  @ApiOperation({ summary: '删除日志文件' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:fileLog:remove')
  @Log('文件日志', BusinessType.DELETE)
  async remove(@Body() dto: RemoveFileLogDto): Promise<void> {
    await this.fileLogService.removeFile(dto.name);
  }

  /** 从文件名推断分类（下载接口用，非法文件名返回空以触发校验错误） */
  private parseCategory(name: string): string {
    const match = /^(access|app|error)-/.exec(name);
    return match ? match[1] : '';
  }
}
