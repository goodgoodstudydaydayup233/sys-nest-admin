import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DictType } from '../entities/dict-type.entity';
import { QueryDictTypeDto } from '../dto/query-dict-type.dto';

@Injectable()
export class DictTypeRepository {
  constructor(
    @InjectRepository(DictType)
    private readonly repo: Repository<DictType>,
  ) {}

  async findById(id: number): Promise<DictType | null> {
    return this.repo.findOne({
      where: { id, deleteStatus: '0' },
      relations: ['group'],
    });
  }

  async findByType(type: string): Promise<DictType | null> {
    return this.repo.findOne({
      where: { type, deleteStatus: '0' },
      relations: ['group'],
    });
  }

  /**
   * 查询所有启用的字典类型（用于刷新缓存时批量加载）
   */
  async findAllActive(): Promise<DictType[]> {
    return this.repo.find({
      where: { deleteStatus: '0', status: '1' },
      order: { sort: 'ASC' },
    });
  }

  async findAll(query: QueryDictTypeDto): Promise<{ list: DictType[]; total: number }> {
    const { page = 1, pageSize = 10, name, type, groupId, status } = query;

    const qb = this.repo.createQueryBuilder('dt');
    qb.leftJoinAndSelect('dt.group', 'fg');
    qb.where('dt.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (name) {
      qb.andWhere('dt.name LIKE :name', { name: `%${name}%` });
    }
    if (type) {
      qb.andWhere('dt.type LIKE :type', { type: `%${type}%` });
    }
    if (groupId) {
      qb.andWhere('dt.groupId = :groupId', { groupId });
    }
    if (status !== undefined) {
      qb.andWhere('dt.status = :status', { status });
    }

    qb.orderBy('dt.sort', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<DictType>): Promise<DictType> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<DictType>): Promise<DictType | null> {
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
