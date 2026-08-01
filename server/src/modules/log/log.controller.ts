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
import { LogService } from './log.service';
import { QueryLogDto } from './dto/query-log.dto';
import { LogVo, LogListVo } from './vo/log.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

/**
 * 操作日志控制器
 * @description 提供操作日志的查询、详情、批量删除、清空
 *
 * @路由前缀 /{dev-api|prod-api}/oper-log
 * @接口列表
 * - GET    /oper-log           获取操作日志列表（分页 + 筛选）
 * - GET    /oper-log/:id       获取操作日志详情
 * - DELETE /oper-log           批量删除操作日志（body: { ids: number[] }）
 * - DELETE /oper-log/clean     清空所有操作日志
 */
@ApiTags('操作日志')
@Controller('oper-log')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @ApiOperation({ summary: '获取操作日志列表' })
  @ApiResponse({ status: 200, description: '成功', type: LogListVo })
  @Permission('monitor:operlog:list')
  async findAll(@Query() query: QueryLogDto): Promise<LogListVo> {
    return this.logService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取操作日志详情' })
  @ApiResponse({ status: 200, description: '成功', type: LogVo })
  @Permission('monitor:operlog:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LogVo | null> {
    return this.logService.findById(id);
  }

  @Delete('clean')
  @ApiOperation({ summary: '清空所有操作日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:operlog:remove')
  @Log('操作日志', BusinessType.CLEAN)
  async clean(): Promise<void> {
    await this.logService.clear();
  }

  @Delete()
  @ApiOperation({ summary: '批量删除操作日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:operlog:remove')
  @Log('操作日志', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.logService.remove(batchDeleteDto.ids);
  }
}
