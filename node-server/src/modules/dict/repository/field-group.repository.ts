import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldGroup } from '../entities/field-group.entity';
import { QueryFieldGroupDto } from '../dto/query-field-group.dto';

@Injectable()
export class FieldGroupRepository {
  constructor(
    @InjectRepository(FieldGroup)
    private readonly repo: Repository<FieldGroup>,
  ) {}

  async findById(id: number): Promise<FieldGroup | null> {
    return this.repo.findOne({
      where: { id, deleteStatus: '0' },
    });
  }

  async findByCode(code: string): Promise<FieldGroup | null> {
    return this.repo.findOne({
      where: { code, deleteStatus: '0' },
    });
  }

  async findAll(query: QueryFieldGroupDto): Promise<{ list: FieldGroup[]; total: number }> {
    const { page = 1, pageSize = 10, name, status } = query;

    const qb = this.repo.createQueryBuilder('fg');
    qb.where('fg.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (name) {
      qb.andWhere('fg.name LIKE :name', { name: `%${name}%` });
    }
    if (status !== undefined) {
      qb.andWhere('fg.status = :status', { status });
    }

    qb.orderBy('fg.sort', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async findAllActive(): Promise<FieldGroup[]> {
    return this.repo.find({
      where: { deleteStatus: '0', status: '1' },
      order: { sort: 'ASC' },
    });
  }

  async create(data: Partial<FieldGroup>): Promise<FieldGroup> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<FieldGroup>): Promise<FieldGroup | null> {
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
