import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id, deleteStatus: '0' },
      relations: ['menus'],
    });
  }

  async findByIds(ids: number[]): Promise<Role[]> {
    return this.roleRepository.findByIds(ids);
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, deleteStatus: '0' },
    });
  }

  async findAll(query: QueryRoleDto): Promise<{ list: Role[]; total: number }> {
    const { page = 1, pageSize = 10, name, status } = query;

    const qb = this.roleRepository.createQueryBuilder('role');
    qb.leftJoinAndSelect('role.menus', 'menu');
    qb.where('role.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (name) {
      qb.andWhere('role.name LIKE :name', { name: `%${name}%` });
    }
    if (status !== undefined) {
      qb.andWhere('role.status = :status', { status });
    }

    qb.orderBy('role.sort', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async findAllActive(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { deleteStatus: '0' },
      order: { sort: 'ASC' },
    });
  }

  async create(data: Partial<Role>): Promise<Role> {
    const { menus, ...otherData } = data as any;
    const entity = this.roleRepository.create(otherData);
    const result = await this.roleRepository.save(entity);
    const saved = Array.isArray(result) ? result[0] : result;

    if (menus?.length) {
      saved.menus = menus;
      await this.roleRepository.save(saved);
    }

    return this.findById(saved.id) as Promise<Role>;
  }

  async update(id: number, role: Partial<Role>): Promise<Role | null> {
    const { menus, ...otherData } = role as any;
    await this.roleRepository.update(id, otherData);

    if (menus !== undefined) {
      const entity = await this.roleRepository.findOneBy({ id });
      if (entity) {
        entity.menus = menus;
        await this.roleRepository.save(entity);
      }
    }

    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.roleRepository.update(id, { deleteStatus: '1' });
  }

  async batchRemove(ids: number[]): Promise<void> {
    await this.roleRepository.update(ids, { deleteStatus: '1' });
  }
}
