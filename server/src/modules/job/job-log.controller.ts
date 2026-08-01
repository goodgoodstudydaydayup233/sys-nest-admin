import {
  Controller,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JobLogService } from './job-log.service';
import { QueryJobLogDto } from './dto/query-job-log.dto';
import { JobLogVo, JobLogListVo } from './vo/job-log.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

/**
 * 定时任务调度日志控制器
 * @description 对标若依 SysJobLogController，提供调度日志的查询、详情、批量删除、清空
 *
 * @路由前缀 /{dev-api|prod-api}/job-log
 * @接口列表
 * - GET    /job-log           获取日志列表（分页）
 * - GET    /job-log/:id       获取日志详情
 * - DELETE /job-log           批量删除日志（body: { ids: number[] }）
 * - DELETE /job-log/clean     清空所有日志
 */
@ApiTags('定时任务日志')
@Controller('job-log')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobLogController {
  constructor(private readonly jobLogService: JobLogService) {}

  @Get()
  @ApiOperation({ summary: '获取调度日志列表' })
  @ApiResponse({ status: 200, description: '成功', type: JobLogListVo })
  @Permission('monitor:jobLog:list')
  async findAll(@Query() query: QueryJobLogDto): Promise<JobLogListVo> {
    return this.jobLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取调度日志详情' })
  @ApiResponse({ status: 200, description: '成功', type: JobLogVo })
  @Permission('monitor:jobLog:list')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<JobLogVo | null> {
    return this.jobLogService.findById(id);
  }

  @Delete('clean')
  @ApiOperation({ summary: '清空所有调度日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:jobLog:remove')
  @Log('调度日志', BusinessType.CLEAN)
  async clean(): Promise<void> {
    await this.jobLogService.cleanAll();
  }

  @Delete()
  @ApiOperation({ summary: '批量删除调度日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:jobLog:remove')
  @Log('调度日志', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.jobLogService.remove(batchDeleteDto.ids);
  }
}
