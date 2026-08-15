import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { QueryMessageDto } from './dto/query-message.dto';

/**
 * 站内信数据访问层
 * @description 封装 sys_message 表的查询与写入逻辑
 *
 * 关键约束：
 * - 所有「本人视角」操作（收件箱/详情/已读/删除）必须携带 receiverId，
 *   防止越权读取或操作他人的消息
 */
@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 按 ID + 接收人查询单条消息（不存在或不属于当前用户返回 null） */
  async findOwnById(id: number, receiverId: number): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id, receiverId, deleteStatus: '0' },
    });
  }

  /** 分页查询本人收件箱 */
  async findInbox(
    query: QueryMessageDto,
    receiverId: number,
  ): Promise<{ list: Message[]; total: number }> {
    const { page = 1, pageSize = 10, type, status, keyword, beginTime, endTime } = query;

    const qb = this.messageRepository.createQueryBuilder('message');
    qb.where('message.receiverId = :receiverId', { receiverId });
    qb.andWhere('message.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (type) {
      qb.andWhere('message.type = :type', { type });
    }
    if (status) {
      qb.andWhere('message.status = :status', { status });
    }
    if (keyword) {
      qb.andWhere('(message.title LIKE :keyword OR message.content LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }
    if (beginTime) {
      qb.andWhere('message.createdAt >= :beginTime', { beginTime });
    }
    if (endTime) {
      qb.andWhere('message.createdAt <= :endTime', { endTime });
    }

    qb.orderBy('message.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  /** 统计本人未读数量 */
  async countUnread(receiverId: number): Promise<number> {
    return this.messageRepository.count({
      where: { receiverId, status: '0', deleteStatus: '0' },
    });
  }

  /** 查询所有启用用户（id + 用户名），用于全员发送 */
  async findActiveUsers(): Promise<{ id: number; username: string }[]> {
    const users = await this.userRepository.find({
      where: { status: '1', deleteStatus: '0' },
      select: ['id', 'username'],
    });
    return users.map((user) => ({ id: user.id, username: user.username }));
  }

  /** 批量写入站内信（同一消息发给多个接收人） */
  async createMany(messages: Partial<Message>[]): Promise<Message[]> {
    const entities = this.messageRepository.create(messages);
    return this.messageRepository.save(entities);
  }

  /** 标记单条消息已读（仅本人） */
  async markRead(id: number, receiverId: number, readAt: Date): Promise<boolean> {
    const result = await this.messageRepository.update(
      { id, receiverId, deleteStatus: '0', status: '0' },
      { status: '1', readAt },
    );
    return (result.affected ?? 0) > 0;
  }

  /** 全部标记已读（仅本人） */
  async markAllRead(receiverId: number, readAt: Date): Promise<void> {
    await this.messageRepository.update(
      { receiverId, deleteStatus: '0', status: '0' },
      { status: '1', readAt },
    );
  }

  /** 软删除本人消息 */
  async removeOwn(id: number, receiverId: number): Promise<boolean> {
    const result = await this.messageRepository.update(
      { id, receiverId, deleteStatus: '0' },
      { deleteStatus: '1' },
    );
    return (result.affected ?? 0) > 0;
  }
}
