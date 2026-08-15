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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { MessageSseService } from './message-sse.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { MessageVo, MessageListVo, UnreadCountVo } from './vo/message.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { User } from '../../common/decorators/user.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';
import { AuthCacheService } from '../auth/auth-cache.service';

/**
 * 站内信控制器
 * @description 提供站内信的发送与「本人收件箱」管理接口
 *
 * @路由前缀 /{dev-api|prod-api}/system/message
 *
 * @接口
 * - POST   /system/message                发送站内信（定向 / 全员）
 * - GET    /system/message/inbox          本人收件箱（分页）
 * - GET    /system/message/unread-count   本人未读数量
 * - GET    /system/message/:id            本人消息详情
 * - PUT    /system/message/read-all       全部标记已读
 * - PUT    /system/message/:id/read       单条标记已读
 * - DELETE /system/message/:id            删除本人消息
 *
 * @权限说明
 * - 发送：需要 system:message:send
 * - 收件箱/未读数/详情/已读/删除：任意登录用户（操作范围限定本人数据）
 */
@ApiTags('站内信')
@Controller('system/message')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageSseService: MessageSseService,
    private readonly jwtService: JwtService,
    private readonly authCacheService: AuthCacheService,
  ) {}

  /**
   * SSE 实时推送端点
   * @description 前端通过 EventSource 建立长连接（无法携带 Authorization 头，
   * 因此 token 通过 query 传递，本端点已加入请求白名单，在此手动校验 JWT）。
   * 连接建立后由 MessageSseService 维护，站内信发送时后端主动推送 new-message 事件。
   */
  @Get('sse')
  @ApiOperation({ summary: '站内信 SSE 实时推送（token 通过 query 传递）' })
  async sse(@Req() req: Request, @Res() res: Response, @Query('token') token?: string): Promise<void> {
    // 手动校验 token（EventSource 无法携带 Authorization 头）
    let userId: number;
    try {
      const payload = await this.jwtService.verifyAsync(token || '');
      userId = payload.sub as number;
    } catch {
      res.status(401).end();
      return;
    }
    // 检查 token 是否已登出（黑名单）
    const blacklisted = await this.authCacheService.isTokenBlacklisted(token || '');
    if (blacklisted) {
      res.status(401).end();
      return;
    }

    // 建立 SSE 连接
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲，确保实时推送
    res.flushHeaders();
    // 发送初始注释，确保前端 onopen 正常触发
    res.write(': connected\n\n');

    this.messageSseService.addClient(userId, res);

    // 心跳：防止代理因空闲断开连接
    const heartbeat = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);
    res.on('close', () => clearInterval(heartbeat));
  }

  @Post()
  @ApiOperation({ summary: '发送站内信（定向 / 全员）' })
  @ApiResponse({ status: 200, description: '成功，返回发送条数' })
  @Permission('system:message:send')
  @Log('站内信', BusinessType.INSERT)
  async send(
    @Body() sendMessageDto: SendMessageDto,
    @User('username') username: string,
  ): Promise<number> {
    return this.messageService.send(sendMessageDto, username);
  }

  @Get('inbox')
  @ApiOperation({ summary: '本人收件箱（分页）' })
  @ApiResponse({ status: 200, description: '成功', type: MessageListVo })
  async findInbox(
    @Query() query: QueryMessageDto,
    @User('id') userId: number,
  ): Promise<MessageListVo> {
    return this.messageService.findInbox(query, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '本人未读数量' })
  @ApiResponse({ status: 200, description: '成功', type: UnreadCountVo })
  async unreadCount(@User('id') userId: number): Promise<UnreadCountVo> {
    return this.messageService.unreadCount(userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  async markAllRead(@User('id') userId: number): Promise<void> {
    return this.messageService.markAllRead(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '本人消息详情' })
  @ApiResponse({ status: 200, description: '成功', type: MessageVo })
  async findOwn(@Param('id') id: number, @User('id') userId: number): Promise<MessageVo> {
    return this.messageService.findOwn(id, userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '单条标记已读' })
  async markRead(@Param('id') id: number, @User('id') userId: number): Promise<void> {
    return this.messageService.markRead(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除本人消息' })
  @Permission('system:message:remove')
  @Log('站内信', BusinessType.DELETE)
  async remove(@Param('id') id: number, @User('id') userId: number): Promise<void> {
    return this.messageService.remove(id, userId);
  }
}
