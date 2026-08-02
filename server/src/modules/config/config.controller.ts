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
import type { Request } from 'express';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigVo, ConfigListVo } from './vo/config.vo';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

@ApiTags('系统配置')
@Controller('config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取配置列表' })
  @ApiResponse({ status: 200, description: '成功', type: ConfigListVo })
  @Permission('system:config:list')
  async findAll(@Query() query: QueryConfigDto): Promise<ConfigListVo> {
    return this.configService.findAll(query);
  }

  @Get('key/:configKey')
  @ApiOperation({ summary: '根据配置键获取值' })
  @Permission('system:config:query')
  async findByKey(@Param('configKey') configKey: string) {
    return this.configService.getValueByKey(configKey);
  }

  @Delete('refreshCache')
  @ApiOperation({ summary: '刷新参数配置缓存' })
  @Permission('system:config:remove')
  @Log('参数配置', BusinessType.OTHER)
  async refreshCache(): Promise<{ count: number }> {
    const count = await this.configService.refreshCache();
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取配置详情' })
  @ApiResponse({ status: 200, description: '成功', type: ConfigVo })
  @Permission('system:config:query')
  async findOne(@Param('id') id: number): Promise<ConfigVo | null> {
    return this.configService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建配置' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:config:add')
  @Log('参数配置', BusinessType.INSERT)
  async create(
    @Body() createConfigDto: CreateConfigDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.configService.create(createConfigDto, req.userInfo!.username);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配置' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:config:edit')
  @Log('参数配置', BusinessType.UPDATE)
  async update(
    @Param('id') id: number,
    @Body() updateConfigDto: UpdateConfigDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.configService.update(
      id,
      updateConfigDto,
      req.userInfo!.username,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除配置' })
  @Permission('system:config:delete')
  @Log('参数配置', BusinessType.DELETE)
  async remove(@Param('id') id: number): Promise<void> {
    return this.configService.remove(id);
  }
}
