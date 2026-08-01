import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysJobLog } from '../entities/sys-job-log.entity';
import { QueryJobLogDto } from '../dto/query-job-log.dto';

@Injectable()
export class JobLogRepository {
  constructor(
    @InjectRepository(SysJobLog)
    private readonly repo: Repository<SysJobLog>,
  ) {}

  async findById(id: number): Promise<SysJobLog | null> {
    return this.repo.findOne({ where: { jobLogId: id } });
  }

  async findAll(query: QueryJobLogDto): Promise<{ list: SysJobLog[]; total: number }> {
    const { page = 1, pageSize = 10, jobName, jobGroup, status, beginTime, endTime } = query;

    const qb = this.repo.createQueryBuilder('l');

    if (jobName) {
      qb.andWhere('l.jobName LIKE :jobName', { jobName: `%${jobName}%` });
    }
    if (jobGroup) {
      qb.andWhere('l.jobGroup = :jobGroup', { jobGroup });
    }
    if (status !== undefined) {
      qb.andWhere('l.status = :status', { status });
    }
    if (beginTime) {
      qb.andWhere('l.createTime >= :beginTime', { beginTime: `${beginTime} 00:00:00` });
    }
    if (endTime) {
      qb.andWhere('l.createTime <= :endTime', { endTime: `${endTime} 23:59:59` });
    }

    qb.orderBy('l.jobLogId', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<SysJobLog>): Promise<SysJobLog> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async remove(ids: number[]): Promise<void> {
    await this.repo.delete(ids);
  }

  async cleanAll(): Promise<void> {
    await this.repo.clear();
  }
}
