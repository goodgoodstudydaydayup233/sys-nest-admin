import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deleteStatus: '0' },
      relations: ['roles'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, deleteStatus: '0' },
      relations: ['roles', 'roles.menus'],
    });
  }

  /**
   * 按 ID 加载用户及其角色、角色菜单
   * @description 用于用户信息缓存缺失时从数据库重建权限（避免强制用户重新登录）
   */
  async findByIdWithRolesMenus(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deleteStatus: '0' },
      relations: ['roles', 'roles.menus'],
    });
  }

  async findAll(query: QueryUserDto): Promise<{ list: User[]; total: number }> {
    const { page = 1, pageSize = 10, username, nickname, phone, status } = query;

    const qb = this.userRepository.createQueryBuilder('user');
    qb.leftJoinAndSelect('user.roles', 'role');
    qb.where('user.deleteStatus = :deleteStatus', { deleteStatus: '0' });

    if (username) {
      qb.andWhere('user.username LIKE :username', { username: `%${username}%` });
    }
    if (nickname) {
      qb.andWhere('user.nickname LIKE :nickname', { nickname: `%${nickname}%` });
    }
    if (phone) {
      qb.andWhere('user.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (status !== undefined) {
      qb.andWhere('user.status = :status', { status });
    }

    qb.orderBy('user.id', 'ASC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async create(user: Partial<User>): Promise<User> {
    const { roles, ...userData } = user as any;
    const newUser = this.userRepository.create(userData);
    const result = await this.userRepository.save(newUser);
    const saved = Array.isArray(result) ? result[0] : result;

    if (roles?.length) {
      saved.roles = roles;
      await this.userRepository.save(saved);
    }

    return this.findById(saved.id) as Promise<User>;
  }

  async update(id: number, user: Partial<User>): Promise<User | null> {
    const { roles, ...userData } = user as any;
    await this.userRepository.update(id, userData);

    if (roles !== undefined) {
      const entity = await this.userRepository.findOneBy({ id });
      if (entity) {
        entity.roles = roles;
        await this.userRepository.save(entity);
      }
    }

    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.update(id, { deleteStatus: '1' });
  }

  async batchRemove(ids: number[]): Promise<void> {
    await this.userRepository.update(ids, { deleteStatus: '1' });
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
  }
}
