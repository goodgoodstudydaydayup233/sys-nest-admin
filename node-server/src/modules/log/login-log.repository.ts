import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoginLog } from './entities/login-log.entity';
import { QueryLoginLogDto } from './dto/query-login-log.dto';

/**
 * 登录日志仓储层
 * @description 负责数据库操作
 */
@Injectable()
export class LoginLogRepository {
  constructor(
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
  ) {}

  async findById(id: number): Promise<LoginLog | null> {
    return this.loginLogRepository.findOne({ where: { id } });
  }

  async findAll(query: QueryLoginLogDto): Promise<{ list: LoginLog[]; total: number }> {
    const { page = 1, pageSize = 10, userName, ipaddr, status, startTime, endTime } = query;

    const qb = this.loginLogRepository.createQueryBuilder('log');

    if (userName) {
      qb.andWhere('log.userName LIKE :userName', { userName: `%${userName}%` });
    }
    if (ipaddr) {
      qb.andWhere('log.ipaddr LIKE :ipaddr', { ipaddr: `%${ipaddr}%` });
    }
    if (status) {
      qb.andWhere('log.status = :status', { status });
    }
    if (startTime) {
      qb.andWhere('log.loginTime >= :startTime', { startTime });
    }
    if (endTime) {
      qb.andWhere('log.loginTime <= :endTime', { endTime });
    }

    qb.orderBy('log.id', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(log: Partial<LoginLog>): Promise<void> {
    const newLog = this.loginLogRepository.create(log);
    await this.loginLogRepository.save(newLog);
  }

  async remove(ids: number[]): Promise<void> {
    await this.loginLogRepository.delete({ id: In(ids) });
  }

  async clear(): Promise<void> {
    await this.loginLogRepository.clear();
  }
}
