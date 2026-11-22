import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysJob } from '../entities/sys-job.entity';
import { QueryJobDto } from '../dto/query-job.dto';

@Injectable()
export class JobRepository {
  constructor(
    @InjectRepository(SysJob)
    private readonly repo: Repository<SysJob>,
  ) {}

  async findById(id: number): Promise<SysJob | null> {
    return this.repo.findOne({ where: { id, deleteStatus: '0' } });
  }

  /** 查询所有可运行任务（未删除 + 状态正常） */
  async findRunnable(): Promise<SysJob[]> {
    return this.repo.find({ where: { deleteStatus: '0', status: '0' } });
  }

  async findAll(query: QueryJobDto): Promise<{ list: SysJob[]; total: number }> {
    const { page = 1, pageSize = 10, jobName, jobGroup, status } = query;

    const qb = this.repo.createQueryBuilder('j');
    qb.where('j.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (jobName) {
      qb.andWhere('j.jobName LIKE :jobName', { jobName: `%${jobName}%` });
    }
    if (jobGroup) {
      qb.andWhere('j.jobGroup = :jobGroup', { jobGroup });
    }
    if (status !== undefined) {
      qb.andWhere('j.status = :status', { status });
    }

    qb.orderBy('j.id', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<SysJob>): Promise<SysJob> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<SysJob>): Promise<SysJob | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.update(id, { deleteStatus: '1' });
  }

  async batchRemove(ids: number[]): Promise<void> {
    await this.repo.update(ids, { deleteStatus: '1' });
  }
}
