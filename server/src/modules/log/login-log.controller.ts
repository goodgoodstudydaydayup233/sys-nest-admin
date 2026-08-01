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
import { LoginLogService } from './login-log.service';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLogVo, LoginLogListVo } from './vo/login-log.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

/**
 * 登录日志控制器
 * @description 对标若依 SysLogininforController，提供登录日志的查询、详情、批量删除、清空
 *
 * @路由前缀 /{dev-api|prod-api}/logininfor
 * @接口列表
 * - GET    /logininfor           获取登录日志列表（分页 + 筛选）
 * - GET    /logininfor/:id       获取登录日志详情
 * - DELETE /logininfor           批量删除登录日志（body: { ids: number[] }）
 * - DELETE /logininfor/clean     清空所有登录日志
 */
@ApiTags('登录日志')
@Controller('logininfor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @Get()
  @ApiOperation({ summary: '获取登录日志列表' })
  @ApiResponse({ status: 200, description: '成功', type: LoginLogListVo })
  @Permission('monitor:logininfor:list')
  async findAll(@Query() query: QueryLoginLogDto): Promise<LoginLogListVo> {
    return this.loginLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取登录日志详情' })
  @ApiResponse({ status: 200, description: '成功', type: LoginLogVo })
  @Permission('monitor:logininfor:list')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LoginLogVo | null> {
    return this.loginLogService.findById(id);
  }

  @Delete('clean')
  @ApiOperation({ summary: '清空所有登录日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:logininfor:remove')
  async clean(): Promise<void> {
    await this.loginLogService.clear();
  }

  @Delete()
  @ApiOperation({ summary: '批量删除登录日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:logininfor:remove')
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.loginLogService.remove(batchDeleteDto.ids);
  }
}
