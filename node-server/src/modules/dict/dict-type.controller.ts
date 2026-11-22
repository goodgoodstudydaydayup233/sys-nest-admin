import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { DictTypeService } from './dict-type.service';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { QueryDictTypeDto } from './dto/query-dict-type.dto';
import { DictTypeVo, DictTypeListVo } from './vo/dict-type.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

@ApiTags('字典类型')
@Controller('dict-type')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DictTypeController {
  constructor(private readonly dictTypeService: DictTypeService) {}

  @Get()
  @ApiOperation({ summary: '获取字典类型列表' })
  @ApiResponse({ status: 200, description: '成功', type: DictTypeListVo })
  @Permission('system:dictType:list')
  async findAll(@Query() query: QueryDictTypeDto): Promise<DictTypeListVo> {
    return this.dictTypeService.findAll(query);
  }

  @Get('refresh')
  @ApiOperation({ summary: '刷新字典缓存' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictType:edit')
  @Log('字典类型', BusinessType.OTHER)
  async refreshCache(): Promise<{ count: number }> {
    return this.dictTypeService.refreshCache();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取字典类型详情' })
  @ApiResponse({ status: 200, description: '成功', type: DictTypeVo })
  @Permission('system:dictType:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DictTypeVo | null> {
    return this.dictTypeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建字典类型' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictType:add')
  @Log('字典类型', BusinessType.INSERT)
  async create(@Body() createDictTypeDto: CreateDictTypeDto, @Req() req: Request): Promise<void> {
    await this.dictTypeService.create(createDictTypeDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新字典类型' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictType:edit')
  @Log('字典类型', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDictTypeDto: UpdateDictTypeDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.dictTypeService.update(id, updateDictTypeDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除字典类型' })
  @ApiBody({ type: BatchDeleteDto })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictType:delete')
  @Log('字典类型', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.dictTypeService.batchRemove(batchDeleteDto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字典类型' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictType:delete')
  @Log('字典类型', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dictTypeService.remove(id);
  }
}
