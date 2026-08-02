import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { DictDataService } from './dict-data.service';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';
import { QueryDictDataDto } from './dto/query-dict-data.dto';
import { DictDataVo, DictDataListVo } from './vo/dict-data.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

@ApiTags('字典数据')
@Controller('dict-data')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DictDataController {
  constructor(private readonly dictDataService: DictDataService) {}

  @Get()
  @ApiOperation({ summary: '获取字典数据列表' })
  @ApiResponse({ status: 200, description: '成功', type: DictDataListVo })
  @Permission('system:dictData:list')
  async findAll(@Query() query: QueryDictDataDto): Promise<DictDataListVo> {
    return this.dictDataService.findAll(query);
  }

  @Get('type/:dictType')
  @ApiOperation({ summary: '根据字典类型获取字典数据' })
  @ApiResponse({ status: 200, description: '成功', type: [DictDataVo] })
  @Permission('system:dictData:list')
  async findByDictType(@Param('dictType') dictType: string): Promise<DictDataVo[]> {
    return this.dictDataService.findByDictType(dictType);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取字典数据详情' })
  @ApiResponse({ status: 200, description: '成功', type: DictDataVo })
  @Permission('system:dictData:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DictDataVo | null> {
    return this.dictDataService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建字典数据' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictData:add')
  @Log('字典数据', BusinessType.INSERT)
  async create(@Body() createDictDataDto: CreateDictDataDto, @Req() req: Request): Promise<void> {
    await this.dictDataService.create(createDictDataDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新字典数据' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictData:edit')
  @Log('字典数据', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDictDataDto: UpdateDictDataDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.dictDataService.update(id, updateDictDataDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除字典数据' })
  @ApiBody({ type: BatchDeleteDto })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictData:delete')
  @Log('字典数据', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.dictDataService.batchRemove(batchDeleteDto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字典数据' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:dictData:delete')
  @Log('字典数据', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dictDataService.remove(id);
  }
}
