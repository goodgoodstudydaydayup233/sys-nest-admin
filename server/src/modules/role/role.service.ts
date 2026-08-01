import { Injectable } from '@nestjs/common';
import { RoleRepository } from './role.repository';
import { MenuRepository } from '../menu/menu.repository';
import { QueryRoleDto } from './dto/query-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleVo, RoleListVo } from './vo/role.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly menuRepository: MenuRepository,
  ) {}

  async findById(id: number): Promise<RoleVo | null> {
    const role = await this.roleRepository.findById(id);
    return role ? this.toRoleVo(role) : null;
  }

  async findAll(query: QueryRoleDto): Promise<RoleListVo> {
    const { list, total } = await this.roleRepository.findAll(query);

    return {
      list: list.map((role) => this.toRoleVo(role)),
      total,
    };
  }

  async findAllActive(): Promise<RoleVo[]> {
    const roles = await this.roleRepository.findAllActive();
    return roles.map((role) => this.toRoleVo(role));
  }

  async create(createRoleDto: CreateRoleDto, username?: string): Promise<RoleVo> {
    const { menuIds, ...otherData } = createRoleDto as any;
    const existing = await this.roleRepository.findByName(otherData.name);
    if (existing) {
      throw new BusinessException('角色名称已存在', ErrorCodeEnum.ROLE_ALREADY_EXISTS);
    }

    const menus = menuIds?.length
      ? await this.menuRepository.findByIds(menuIds)
      : [];

    const role = await this.roleRepository.create({
      ...otherData,
      menus,
      createdBy: username,
    });
    return this.toRoleVo(role);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, username?: string): Promise<RoleVo | null> {
    const { menuIds, ...otherData } = updateRoleDto as any;
    if (otherData.name) {
      const existing = await this.roleRepository.findByName(otherData.name);
      if (existing && existing.id !== id) {
        throw new BusinessException('角色名称已存在', ErrorCodeEnum.ROLE_ALREADY_EXISTS);
      }
    }

    const updateData: any = { ...otherData, updatedBy: username };

    if (menuIds !== undefined) {
      updateData.menus = menuIds?.length
        ? await this.menuRepository.findByIds(menuIds)
        : [];
    }

    const role = await this.roleRepository.update(id, updateData);
    return role ? this.toRoleVo(role) : null;
  }

  async remove(id: number): Promise<void> {
    return this.roleRepository.remove(id);
  }

  async batchRemove(ids: number[]): Promise<void> {
    return this.roleRepository.batchRemove(ids);
  }

  private toRoleVo(role: any): RoleVo {
    return {
      id: role.id,
      name: role.name,
      permission: role.permission,
      status: role.status,
      sort: role.sort,
      remark: role.remark,
      menus: role.menus?.map((menu: any) => ({
        id: menu.id,
        menuName: menu.menuName,
        perms: menu.perms,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
