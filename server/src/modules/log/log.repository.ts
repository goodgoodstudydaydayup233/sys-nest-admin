import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OperationLog } from './entities/operation-log.entity';
import { QueryLogDto } from './dto/query-log.dto';

/**
 * 操作日志仓储层
 * @description 对标若依 SysOperLogMapper，负责数据库操作
 */
@Injectable()
export class LogRepository {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
  ) {}

  async findById(id: number): Promise<OperationLog | null> {
    return this.logRepository.findOne({ where: { id } });
  }

  async findAll(query: QueryLogDto): Promise<{ list: OperationLog[]; total: number }> {
    const { page = 1, pageSize = 10, title, operName, businessType, status, requestMethod, startTime, endTime } = query;

    const qb = this.logRepository.createQueryBuilder('log');

    if (title) {
      qb.andWhere('log.title LIKE :title', { title: `%${title}%` });
    }
    if (operName) {
      qb.andWhere('log.operName LIKE :operName', { operName: `%${operName}%` });
    }
    if (businessType) {
      qb.andWhere('log.businessType = :businessType', { businessType });
    }
    if (status) {
      qb.andWhere('log.status = :status', { status });
    }
    if (requestMethod) {
      qb.andWhere('log.requestMethod = :requestMethod', { requestMethod });
    }
    if (startTime) {
      qb.andWhere('log.createdAt >= :startTime', { startTime });
    }
    if (endTime) {
      qb.andWhere('log.createdAt <= :endTime', { endTime });
    }

    qb.orderBy('log.id', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(log: Partial<OperationLog>): Promise<void> {
    const newLog = this.logRepository.create(log);
    await this.logRepository.save(newLog);
  }

  async remove(ids: number[]): Promise<void> {
    await this.logRepository.delete({ id: In(ids) });
  }

  async clear(): Promise<void> {
    await this.logRepository.clear();
  }
}
