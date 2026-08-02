import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { MenuVo, MenuTreeVo } from './vo/menu.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

@ApiTags('菜单管理')
@Controller('menu')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: '获取菜单列表' })
  @ApiResponse({ status: 200, description: '成功', type: [MenuVo] })
  @Permission('system:menu:list')
  async findAll(@Query() query: QueryMenuDto): Promise<MenuVo[]> {
    return this.menuService.findAll(query);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取菜单树' })
  @ApiResponse({ status: 200, description: '成功', type: [MenuTreeVo] })
  @Permission('system:menu:list')
  async findTree(): Promise<MenuTreeVo[]> {
    return this.menuService.findTree();
  }

  @Get('roleMenuTreeselect/:id')
  @ApiOperation({ summary: '菜单管理-角色-树表' })
  @Permission('system:menu:query')
  async roleMenuTreeselect(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.roleMenuTreeselect(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜单详情' })
  @ApiResponse({ status: 200, description: '成功', type: MenuVo })
  @Permission('system:menu:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuVo | null> {
    return this.menuService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:menu:add')
  @Log('菜单管理', BusinessType.INSERT)
  async create(@Body() createMenuDto: CreateMenuDto, @Req() req: Request): Promise<void> {
    await this.menuService.create(createMenuDto, req.userInfo?.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:menu:edit')
  @Log('菜单管理', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.menuService.update(id, updateMenuDto, req.userInfo?.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  @Permission('system:menu:delete')
  @Log('菜单管理', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.menuService.remove(id);
  }
}
