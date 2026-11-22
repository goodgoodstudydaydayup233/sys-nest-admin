import { Injectable } from '@nestjs/common';
import { MenuRepository } from './menu.repository';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuVo, MenuTreeVo } from './vo/menu.vo';
import { AuthCacheService } from '../auth/auth-cache.service';

@Injectable()
export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly authCacheService: AuthCacheService,
  ) {}

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
    // 新增菜单可能携带权限标识（perms），清除用户缓存使权限即时生效
    await this.authCacheService.clearAllUserCache();
    return this.toMenuVo(menu);
  }

  async update(id: number, updateMenuDto: UpdateMenuDto, username?: string): Promise<MenuVo | null> {
    const menu = await this.menuRepository.update(id, {
      ...updateMenuDto,
      updatedBy: username,
    });
    // 菜单权限标识可能变更，清除用户缓存使权限即时生效
    await this.authCacheService.clearAllUserCache();
    return menu ? this.toMenuVo(menu) : null;
  }

  async remove(id: number): Promise<void> {
    await this.menuRepository.remove(id);
    // 菜单被删除，相关用户的权限需立即刷新
    await this.authCacheService.clearAllUserCache();
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
