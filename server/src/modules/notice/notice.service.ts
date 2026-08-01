import { Injectable } from '@nestjs/common';
import { NoticeRepository } from './notice.repository';
import { Notice } from './entities/notice.entity';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticeVo, NoticeListVo } from './vo/notice.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

/**
 * 通知公告服务
 * @description 对标若依 SysNoticeService，提供通知公告的 CRUD 能力
 *
 * @业务规则
 * - 通知类型：1-通知 2-公告
 * - 状态：0-正常 1-关闭
 * - 软删除：通过 deleteStatus 标记，不物理删除
 */
@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async findById(id: number): Promise<NoticeVo | null> {
    const notice = await this.noticeRepository.findById(id);
    if (!notice) {
      throw new BusinessException('通知公告不存在', ErrorCodeEnum.NOT_FOUND);
    }
    return this.toNoticeVo(notice);
  }

  async findAll(query: QueryNoticeDto): Promise<NoticeListVo> {
    const { list, total } = await this.noticeRepository.findAll(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    return {
      list: list.map((notice) => this.toNoticeVo(notice)),
      total,
      page,
      pageSize,
    };
  }

  async create(createNoticeDto: CreateNoticeDto, username: string): Promise<NoticeVo> {
    const notice = await this.noticeRepository.create({
      ...createNoticeDto,
      status: createNoticeDto.status || '0',
      createdBy: username,
    });
    return this.toNoticeVo(notice);
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto, username: string): Promise<NoticeVo | null> {
    const existing = await this.noticeRepository.findById(id);
    if (!existing) {
      throw new BusinessException('通知公告不存在', ErrorCodeEnum.NOT_FOUND);
    }

    const notice = await this.noticeRepository.update(id, {
      ...updateNoticeDto,
      updatedBy: username,
    });
    return notice ? this.toNoticeVo(notice) : null;
  }

  async remove(id: number): Promise<void> {
    const existing = await this.noticeRepository.findById(id);
    if (!existing) {
      throw new BusinessException('通知公告不存在', ErrorCodeEnum.NOT_FOUND);
    }
    await this.noticeRepository.remove(id);
  }

  private toNoticeVo(notice: Notice): NoticeVo {
    return {
      id: notice.id,
      noticeTitle: notice.noticeTitle,
      noticeType: notice.noticeType,
      noticeContent: notice.noticeContent,
      status: notice.status,
      createBy: notice.createdBy,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    };
  }
}
