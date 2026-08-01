import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { QueryNoticeDto } from './dto/query-notice.dto';

/**
 * 通知公告数据访问层
 * @description 封装 sys_notice 表的查询逻辑，软删除通过 deleteStatus='0' 过滤
 */
@Injectable()
export class NoticeRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async findById(id: number): Promise<Notice | null> {
    return this.noticeRepository.findOne({
      where: { id, deleteStatus: '0' },
    });
  }

  async findAll(query: QueryNoticeDto): Promise<{ list: Notice[]; total: number }> {
    const { page = 1, pageSize = 10, noticeTitle, noticeType, createBy } = query;

    const qb = this.noticeRepository.createQueryBuilder('notice');
    qb.where('notice.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (noticeTitle) {
      qb.andWhere('notice.noticeTitle LIKE :noticeTitle', { noticeTitle: `%${noticeTitle}%` });
    }
    if (noticeType) {
      qb.andWhere('notice.noticeType = :noticeType', { noticeType });
    }
    if (createBy) {
      qb.andWhere('notice.createdBy LIKE :createBy', { createBy: `%${createBy}%` });
    }

    qb.orderBy('notice.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(notice: Partial<Notice>): Promise<Notice> {
    const newNotice = this.noticeRepository.create(notice);
    return this.noticeRepository.save(newNotice);
  }

  async update(id: number, notice: Partial<Notice>): Promise<Notice | null> {
    await this.noticeRepository.update(id, notice);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.noticeRepository.update(id, { deleteStatus: '1' });
  }
}
