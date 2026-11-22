import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { JobVo, JobListVo } from './vo/job.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

/**
 * 定时任务管理控制器
 * @description 提供任务的增删改查、状态切换、立即执行
 *
 * @路由前缀 /{dev-api|prod-api}/job
 * @接口列表
 * - GET    /job              获取任务列表（分页）
 * - GET    /job/:id          获取任务详情
 * - POST   /job              创建任务
 * - PUT    /job/:id          更新任务
 * - DELETE /job/:id          删除任务
 * - DELETE /job/batch        批量删除任务
 * - PUT    /job/changeStatus 修改任务状态
 * - PUT    /job/run          立即执行一次
 */
@ApiTags('定时任务')
@Controller('job')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiOperation({ summary: '获取定时任务列表' })
  @ApiResponse({ status: 200, description: '成功', type: JobListVo })
  @Permission('monitor:job:list')
  async findAll(@Query() query: QueryJobDto): Promise<JobListVo> {
    return this.jobService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取定时任务详情' })
  @ApiResponse({ status: 200, description: '成功', type: JobVo })
  @Permission('monitor:job:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<JobVo | null> {
    return this.jobService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建定时任务' })
  @ApiResponse({ status: 200, description: '成功', type: JobVo })
  @Permission('monitor:job:add')
  @Log('定时任务', BusinessType.INSERT)
  async create(@Body() createJobDto: CreateJobDto, @Req() req: Request): Promise<JobVo> {
    return this.jobService.create(createJobDto, req.userInfo?.username);
  }

  // 固定路径必须声明在动态路径 :id 之前，避免被当作 id 匹配
  @Put('changeStatus')
  @ApiOperation({ summary: '修改定时任务状态' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:job:changeStatus')
  @Log('定时任务', BusinessType.UPDATE)
  async changeStatus(
    @Body('jobId', ParseIntPipe) jobId: number,
    @Body('status') status: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.jobService.changeStatus(jobId, status, req.userInfo?.username);
  }

  @Put('run')
  @ApiOperation({ summary: '立即执行一次定时任务' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:job:run')
  @Log('定时任务', BusinessType.OTHER)
  async run(@Body('jobId', ParseIntPipe) jobId: number): Promise<void> {
    await this.jobService.run(jobId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新定时任务' })
  @ApiResponse({ status: 200, description: '成功', type: JobVo })
  @Permission('monitor:job:edit')
  @Log('定时任务', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: Request,
  ): Promise<JobVo | null> {
    return this.jobService.update(id, updateJobDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除定时任务' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:job:remove')
  @Log('定时任务', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.jobService.batchRemove(batchDeleteDto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除定时任务' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:job:remove')
  @Log('定时任务', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.jobService.remove(id);
  }
}
