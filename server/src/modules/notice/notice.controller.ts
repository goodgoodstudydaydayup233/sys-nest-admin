import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { NoticeVo, NoticeListVo } from './vo/notice.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

/**
 * 通知公告控制器
 * @description 提供通知公告 CRUD 接口
 *
 * @路由前缀 /{dev-api|prod-api}/system/notice
 *
 * @接口
 * - GET    /system/notice           获取通知公告列表（分页）
 * - GET    /system/notice/:id       获取通知公告详情
 * - POST   /system/notice           创建通知公告
 * - PUT    /system/notice/:id       更新通知公告
 * - DELETE /system/notice/:id       删除通知公告
 *
 * @权限标识
 * - system:notice:list    查询
 * - system:notice:query   详情
 * - system:notice:add     新增
 * - system:notice:edit    修改
 * - system:notice:remove  删除
 */
@ApiTags('通知公告')
@Controller('system/notice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  @ApiOperation({ summary: '获取通知公告列表' })
  @ApiResponse({ status: 200, description: '成功', type: NoticeListVo })
  @Permission('system:notice:list')
  async findAll(@Query() query: QueryNoticeDto): Promise<NoticeListVo> {
    return this.noticeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取通知公告详情' })
  @ApiResponse({ status: 200, description: '成功', type: NoticeVo })
  @Permission('system:notice:query')
  async findOne(@Param('id') id: number): Promise<NoticeVo | null> {
    return this.noticeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建通知公告' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:notice:add')
  @Log('通知公告', BusinessType.INSERT)
  async create(
    @Body() createNoticeDto: CreateNoticeDto,
    @Req() req: any,
  ): Promise<NoticeVo> {
    return this.noticeService.create(createNoticeDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新通知公告' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:notice:edit')
  @Log('通知公告', BusinessType.UPDATE)
  async update(
    @Param('id') id: number,
    @Body() updateNoticeDto: UpdateNoticeDto,
    @Req() req: any,
  ): Promise<NoticeVo | null> {
    return this.noticeService.update(id, updateNoticeDto, req.userInfo?.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知公告' })
  @Permission('system:notice:remove')
  @Log('通知公告', BusinessType.DELETE)
  async remove(@Param('id') id: number): Promise<void> {
    return this.noticeService.remove(id);
  }
}
