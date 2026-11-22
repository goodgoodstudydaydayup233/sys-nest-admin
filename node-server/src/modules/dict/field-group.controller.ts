import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { FieldGroupService } from './field-group.service';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { QueryFieldGroupDto } from './dto/query-field-group.dto';
import { FieldGroupVo, FieldGroupListVo } from './vo/field-group.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BatchDeleteDto } from '../role/dto/batch-delete.dto';

@ApiTags('字段分组')
@Controller('field-group')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FieldGroupController {
  constructor(private readonly fieldGroupService: FieldGroupService) {}

  @Get()
  @ApiOperation({ summary: '获取分组列表' })
  @ApiResponse({ status: 200, description: '成功', type: FieldGroupListVo })
  @Permission('system:fieldGroup:list')
  async findAll(@Query() query: QueryFieldGroupDto): Promise<FieldGroupListVo> {
    return this.fieldGroupService.findAll(query);
  }

  @Get('all')
  @ApiOperation({ summary: '获取全部启用分组' })
  @ApiResponse({ status: 200, description: '成功', type: [FieldGroupVo] })
  @Permission('system:fieldGroup:list')
  async findAllActive(): Promise<FieldGroupVo[]> {
    return this.fieldGroupService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分组详情' })
  @ApiResponse({ status: 200, description: '成功', type: FieldGroupVo })
  @Permission('system:fieldGroup:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FieldGroupVo | null> {
    return this.fieldGroupService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建分组' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:fieldGroup:add')
  @Log('字段分组', BusinessType.INSERT)
  async create(@Body() createFieldGroupDto: CreateFieldGroupDto, @Req() req: Request): Promise<void> {
    await this.fieldGroupService.create(createFieldGroupDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分组' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:fieldGroup:edit')
  @Log('字段分组', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFieldGroupDto: UpdateFieldGroupDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.fieldGroupService.update(id, updateFieldGroupDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除分组' })
  @ApiBody({ type: BatchDeleteDto })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:fieldGroup:delete')
  @Log('字段分组', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.fieldGroupService.batchRemove(batchDeleteDto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分组' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:fieldGroup:delete')
  @Log('字段分组', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.fieldGroupService.remove(id);
  }
}
