import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { QueryMenuDto } from './dto/query-menu.dto';

@Injectable()
export class MenuRepository {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async findById(id: number): Promise<Menu | null> {
    return this.menuRepository.findOne({
      where: { id, deleteStatus: '0' },
    });
  }

  async findByIds(ids: number[]): Promise<Menu[]> {
    return this.menuRepository.findByIds(ids);
  }

  async findAll(query?: QueryMenuDto): Promise<Menu[]> {
    const qb = this.menuRepository.createQueryBuilder('menu');
    qb.where('menu.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (query?.menuName) {
      qb.andWhere('menu.menuName LIKE :menuName', { menuName: `%${query.menuName}%` });
    }
    if (query?.visible !== undefined) {
      qb.andWhere('menu.visible = :visible', { visible: query.visible });
    }

    qb.orderBy('menu.orderNum', 'ASC');
    return qb.getMany();
  }

  async findByRoleIds(roleIds: number[]): Promise<Menu[]> {
    if (!roleIds.length) {
      return [];
    }

    return this.menuRepository
      .createQueryBuilder('menu')
      .innerJoin('menu.roles', 'role', 'role.id IN (:...roleIds)', { roleIds })
      .where('menu.deleteStatus = :deleteStatus', { deleteStatus: '0' })
      .andWhere("menu.menuType IN (:...types)", { types: ['M', 'C'] })
      .orderBy('menu.orderNum', 'ASC')
      .getMany();
  }

  async findMenuIdsByRoleId(roleId: number): Promise<number[]> {
    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .innerJoin('menu.roles', 'role', 'role.id = :roleId', { roleId })
      .where('menu.deleteStatus = :deleteStatus', { deleteStatus: '0' })
      .select('menu.id', 'id')
      .getRawMany();
    return rows.map((row) => row.id);
  }

  async create(menu: Partial<Menu>): Promise<Menu> {
    const newMenu = this.menuRepository.create(menu);
    return this.menuRepository.save(newMenu);
  }

  async update(id: number, menu: Partial<Menu>): Promise<Menu | null> {
    await this.menuRepository.update(id, menu);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.menuRepository.update(id, { deleteStatus: '1' });
  }
}
