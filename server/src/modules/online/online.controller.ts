import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OnlineService } from './online.service';
import { QueryOnlineDto } from './dto/query-online.dto';
import { OnlineUserVo } from './vo/online-user.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

/**
 * 在线用户控制器
 * @description 提供在线用户监控与强退能力
 *
 * @路由前缀 /{dev-api|prod-api}/monitor/online
 *
 * @接口
 * - GET    /monitor/online/list         查询在线用户列表（支持用户名/IP 筛选）
 * - DELETE /monitor/online/:tokenId     强退指定 token 的用户
 *
 * @权限标识
 * - monitor:online:list   查看在线用户
 * - monitor:online:forceLogout  强退用户
 */
@ApiTags('在线用户')
@Controller('monitor/online')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  @Get('list')
  @ApiOperation({ summary: '查询在线用户列表' })
  @ApiResponse({ status: 200, description: '成功', type: [OnlineUserVo] })
  @Permission('monitor:online:list')
  async list(@Query() query: QueryOnlineDto): Promise<OnlineUserVo[]> {
    return this.onlineService.list(query);
  }

  @Delete(':tokenId')
  @ApiOperation({ summary: '强退用户' })
  @Permission('monitor:online:forceLogout')
  @Log('在线用户', BusinessType.FORCE)
  async forceLogout(@Param('tokenId') tokenId: string): Promise<void> {
    await this.onlineService.forceLogout(tokenId);
  }
}
