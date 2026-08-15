import { Injectable } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { MessageVo, MessageListVo, UnreadCountVo } from './vo/message.vo';
import { MessageSseService } from './message-sse.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

/**
 * 站内信服务
 * @description 提供站内信的发送与「本人视角」管理能力
 *
 * @业务规则
 * - 消息类型：1-系统通知 2-业务提醒 3-任务结果
 * - 状态：0-未读 1-已读
 * - 发送模型：冗余存储，每条消息按接收人各存一条记录
 * - 全员发送：receiverIds 为空时发送给所有启用用户
 * - 越权保护：收件箱/详情/已读/删除均限定在接收人本人数据范围内
 * - 软删除：接收人删除自己消息时通过 deleteStatus 标记，不影响其他接收人
 */
@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly messageSseService: MessageSseService,
  ) {}

  /** 发送站内信（定向 / 全员） */
  async send(sendMessageDto: SendMessageDto, senderName: string): Promise<number> {
    const activeUsers = await this.messageRepository.findActiveUsers();
    if (activeUsers.length === 0) {
      throw new BusinessException('当前没有可接收消息的用户', ErrorCodeEnum.BAD_REQUEST);
    }

    // 确定接收人：未指定 receiverIds 时发送给全员，否则按 ID 过滤
    const receivers =
      sendMessageDto.receiverIds && sendMessageDto.receiverIds.length > 0
        ? activeUsers.filter((user) => sendMessageDto.receiverIds!.includes(user.id))
        : activeUsers;

    if (receivers.length === 0) {
      throw new BusinessException('接收人不存在或已被禁用', ErrorCodeEnum.BAD_REQUEST);
    }

    const messages: Partial<Message>[] = receivers.map((receiver) => ({
      senderName,
      receiverId: receiver.id,
      receiverName: receiver.username,
      title: sendMessageDto.title,
      content: sendMessageDto.content,
      type: sendMessageDto.type,
      status: '0',
      createdBy: senderName,
    }));

    const created = await this.messageRepository.createMany(messages);

    // 后端主动推送：通知所有接收人刷新未读数（SSE）
    const receiverIds = Array.from(
      new Set(messages.map((m) => m.receiverId).filter((id): id is number => id !== undefined)),
    );
    this.messageSseService.sendToUsers(receiverIds, 'new-message', { count: receiverIds.length });

    return created.length;
  }

  /** 分页查询本人收件箱 */
  async findInbox(query: QueryMessageDto, userId: number): Promise<MessageListVo> {
    const { list, total } = await this.messageRepository.findInbox(query, userId);
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    return {
      list: list.map((message) => this.toMessageVo(message)),
      total,
      page,
      pageSize,
    };
  }

  /** 本人未读数量 */
  async unreadCount(userId: number): Promise<UnreadCountVo> {
    const count = await this.messageRepository.countUnread(userId);
    return { count };
  }

  /** 查询本人消息详情 */
  async findOwn(id: number, userId: number): Promise<MessageVo> {
    const message = await this.messageRepository.findOwnById(id, userId);
    if (!message) {
      throw new BusinessException('站内信不存在', ErrorCodeEnum.NOT_FOUND);
    }
    return this.toMessageVo(message);
  }

  /** 标记单条消息已读 */
  async markRead(id: number, userId: number): Promise<void> {
    const updated = await this.messageRepository.markRead(id, userId, new Date());
    if (!updated) {
      throw new BusinessException('站内信不存在或已读', ErrorCodeEnum.NOT_FOUND);
    }
  }

  /** 全部标记已读 */
  async markAllRead(userId: number): Promise<void> {
    await this.messageRepository.markAllRead(userId, new Date());
  }

  /** 删除本人消息（软删除） */
  async remove(id: number, userId: number): Promise<void> {
    const removed = await this.messageRepository.removeOwn(id, userId);
    if (!removed) {
      throw new BusinessException('站内信不存在', ErrorCodeEnum.NOT_FOUND);
    }
  }

  private toMessageVo(message: Message): MessageVo {
    return {
      id: message.id,
      senderName: message.senderName,
      receiverId: message.receiverId,
      receiverName: message.receiverName,
      title: message.title,
      content: message.content,
      type: message.type,
      status: message.status,
      readAt: message.readAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
