import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ServerService } from './server.service';
import { ServerVo } from './vo/server.vo';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';

/**
 * 服务监控控制器
 * @description 提供服务器 CPU/内存/磁盘/系统/Node.js 运行时监控
 *
 * @路由前缀 /{dev-api|prod-api}/monitor/server
 *
 * @接口
 * - GET /monitor/server   获取服务监控信息
 *
 * @权限标识
 * - monitor:server:list   查看服务监控
 */
@ApiTags('服务监控')
@Controller('monitor/server')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  @ApiOperation({ summary: '获取服务监控信息' })
  @ApiResponse({ status: 200, description: '成功', type: ServerVo })
  @Permission('monitor:server:list')
  async getInfo(): Promise<ServerVo> {
    return this.serverService.getServerInfo();
  }
}
