import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { NoticeRepository } from './notice.repository';
import { Notice } from './entities/notice.entity';

/**
 * 通知公告模块
 * @description 对标若依 SysNoticeModule，提供通知公告管理能力
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
  exports: [NoticeService],
})
export class NoticeModule {}
