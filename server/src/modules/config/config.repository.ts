import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from './entities/config.entity';
import { QueryConfigDto } from './dto/query-config.dto';

@Injectable()
export class ConfigRepository {
  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
  ) {}

  async findById(id: number): Promise<Config | null> {
    return this.configRepository.findOne({
      where: { id, deleteStatus: '0' },
    });
  }

  async findByKey(configKey: string): Promise<Config | null> {
    return this.configRepository.findOne({
      where: { configKey, deleteStatus: '0' },
    });
  }

  async findAll(query: QueryConfigDto): Promise<{ list: Config[]; total: number }> {
    const { page = 1, pageSize = 10, name, group } = query;

    const qb = this.configRepository.createQueryBuilder('config');
    qb.where('config.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (name) {
      qb.andWhere('config.name LIKE :name', { name: `%${name}%` });
    }
    if (group) {
      qb.andWhere('config.group = :group', { group });
    }

    qb.orderBy('config.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  /**
   * 查询所有启用的配置（用于缓存预热）
   */
  async findAllActive(): Promise<Config[]> {
    return this.configRepository.find({
      where: { deleteStatus: '0', disabled: '0' },
    });
  }

  async create(config: Partial<Config>): Promise<Config> {
    const newConfig = this.configRepository.create(config);
    return this.configRepository.save(newConfig);
  }

  async update(id: number, config: Partial<Config>): Promise<Config | null> {
    await this.configRepository.update(id, config);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.configRepository.update(id, { deleteStatus: '1' });
  }
}
