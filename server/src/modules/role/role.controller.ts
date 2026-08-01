import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { RoleVo, RoleListVo } from './vo/role.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

@ApiTags('角色管理')
@Controller('role')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '成功', type: RoleListVo })
  @Permission('system:role:list')
  async findAll(@Query() query: QueryRoleDto): Promise<RoleListVo> {
    return this.roleService.findAll(query);
  }

  @Get('all')
  @ApiOperation({ summary: '获取全部角色' })
  @ApiResponse({ status: 200, description: '成功', type: [RoleVo] })
  @Permission('system:role:list')
  async findAllActive(): Promise<RoleVo[]> {
    return this.roleService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponse({ status: 200, description: '成功', type: RoleVo })
  @Permission('system:role:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleVo | null> {
    return this.roleService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:role:add')
  @Log('角色管理', BusinessType.INSERT)
  async create(@Body() createRoleDto: CreateRoleDto, @Req() req: any): Promise<void> {
    await this.roleService.create(createRoleDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:role:edit')
  @Log('角色管理', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: any,
  ): Promise<void> {
    await this.roleService.update(id, updateRoleDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除角色' })
  @ApiBody({ type: BatchDeleteDto })
  @Permission('system:role:delete')
  @Log('角色管理', BusinessType.DELETE)
  async batchRemove(@Body() dto: BatchDeleteDto): Promise<void> {
    await this.roleService.batchRemove(dto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @Permission('system:role:delete')
  @Log('角色管理', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roleService.remove(id);
  }
}
