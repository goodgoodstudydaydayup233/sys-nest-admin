import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DictData } from '../entities/dict-data.entity';
import { QueryDictDataDto } from '../dto/query-dict-data.dto';

@Injectable()
export class DictDataRepository {
  constructor(
    @InjectRepository(DictData)
    private readonly repo: Repository<DictData>,
  ) {}

  async findById(id: number): Promise<DictData | null> {
    return this.repo.findOne({
      where: { id, deleteStatus: '0' },
    });
  }

  async findByTypeId(typeId: number): Promise<DictData[]> {
    return this.repo.find({
      where: { typeId, deleteStatus: '0', status: '1' },
      order: { sort: 'ASC' },
    });
  }

  async findByDictType(dictType: string): Promise<DictData[]> {
    const qb = this.repo.createQueryBuilder('dd');
    qb.innerJoin('dd.dictType', 'dt', 'dt.type = :dictType AND dt.deleteStatus = :ds AND dt.status = :st', {
      dictType,
      ds: '0',
      st: '1',
    });
    qb.where('dd.deleteStatus = :deleteStatus', { deleteStatus: '0' });
    qb.andWhere('dd.status = :status', { status: '1' });
    qb.orderBy('dd.sort', 'ASC');
    return qb.getMany();
  }

  /**
   * 统计某个字典类型下未删除的字典数据数量
   * @description 用于删除字典类型前的级联校验
   */
  async countByTypeId(typeId: number): Promise<number> {
    return this.repo.count({
      where: { typeId, deleteStatus: '0' },
    });
  }

  /**
   * 根据字典类型 ID 软删除其下所有字典数据
   * @description 用于删除字典类型时的级联删除
   */
  async softDeleteByTypeId(typeId: number): Promise<void> {
    await this.repo.update({ typeId, deleteStatus: '0' }, { deleteStatus: '1' });
  }

  async findAll(query: QueryDictDataDto): Promise<{ list: DictData[]; total: number }> {
    const { page = 1, pageSize = 10, label, typeId, dictType, status } = query;

    const qb = this.repo.createQueryBuilder('dd');
    qb.where('dd.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (label) {
      qb.andWhere('dd.label LIKE :label', { label: `%${label}%` });
    }
    if (typeId) {
      qb.andWhere('dd.typeId = :typeId', { typeId });
    }
    if (dictType) {
      qb.innerJoin('dd.dictType', 'dt', 'dt.type = :dictType', { dictType });
    }
    if (status !== undefined) {
      qb.andWhere('dd.status = :status', { status });
    }

    qb.orderBy('dd.sort', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<DictData>): Promise<DictData> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<DictData>): Promise<DictData | null> {
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
