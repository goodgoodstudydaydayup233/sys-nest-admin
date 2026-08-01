import { Injectable } from '@nestjs/common';
import { MenuRepository } from './menu.repository';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuVo, MenuTreeVo } from './vo/menu.vo';

@Injectable()
export class MenuService {
  constructor(private readonly menuRepository: MenuRepository) {}

  async findById(id: number): Promise<MenuVo | null> {
    const menu = await this.menuRepository.findById(id);
    return menu ? this.toMenuVo(menu) : null;
  }

  async findAll(query?: QueryMenuDto): Promise<MenuVo[]> {
    const menus = await this.menuRepository.findAll(query);
    return menus.map((menu) => this.toMenuVo(menu));
  }

  async findTree(): Promise<MenuTreeVo[]> {
    const menus = await this.menuRepository.findAll();
    return this.buildTree(menus);
  }

  async roleMenuTreeselect(roleId: number): Promise<{ menus: MenuTreeVo[]; checkedKeys: number[] }> {
    const [menus, checkedKeys] = await Promise.all([
      this.menuRepository.findAll(),
      this.menuRepository.findMenuIdsByRoleId(roleId),
    ]);
    return {
      menus: this.buildTree(menus),
      checkedKeys,
    };
  }

  async create(createMenuDto: CreateMenuDto, username?: string): Promise<MenuVo> {
    const menu = await this.menuRepository.create({
      ...createMenuDto,
      createdBy: username,
    });
    return this.toMenuVo(menu);
  }

  async update(id: number, updateMenuDto: UpdateMenuDto, username?: string): Promise<MenuVo | null> {
    const menu = await this.menuRepository.update(id, {
      ...updateMenuDto,
      updatedBy: username,
    });
    return menu ? this.toMenuVo(menu) : null;
  }

  async remove(id: number): Promise<void> {
    return this.menuRepository.remove(id);
  }

  private buildTree(menus: any[], parentId: number = 0): MenuTreeVo[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .map((menu) => ({
        ...this.toMenuVo(menu),
        children: this.buildTree(menus, menu.id),
      }));
  }

  private toMenuVo(menu: any): MenuVo {
    return {
      id: menu.id,
      menuName: menu.menuName,
      parentId: menu.parentId,
      orderNum: menu.orderNum,
      path: menu.path,
      component: menu.component,
      query: menu.query,
      isFrame: menu.isFrame,
      isCache: menu.isCache,
      visible: menu.visible,
      menuType: menu.menuType,
      perms: menu.perms,
      icon: menu.icon,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    };
  }
}
