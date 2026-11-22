import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('sys_menu')
export class Menu extends BaseEntity {
  @Column({ type: 'varchar', length: 50, comment: '菜单名称' })
  menuName: string;

  @Column({ type: 'int', default: 0, comment: '父菜单ID' })
  parentId: number;

  @Column({ type: 'int', default: 0, comment: '显示顺序' })
  orderNum: number;

  @Column({ type: 'varchar', length: 200, default: '', nullable: true, comment: '路由地址' })
  path: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '组件路径' })
  component: string;

  @Column({ type: 'varchar', length: 255, default: '', comment: '路由参数' })
  query: string;

  @Column({ type: 'char', default: '1', comment: '是否为外链: 0-是 1-否' })
  isFrame: string;

  @Column({ type: 'char', default: '0', comment: '是否缓存: 0-是 1-否' })
  isCache: string;

  @Column({ type: 'char', default: '0', comment: '是否显示: 0-是 1-否' })
  visible: string;

  @Column({ type: 'char', length: 1, default: 'M', comment: '菜单类型: M-目录 C-菜单 F-按钮' })
  menuType: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '权限标识' })
  perms: string;

  @Column({ type: 'varchar', length: 100, default: '', nullable: true, comment: '菜单图标' })
  icon: string;

  @ManyToMany(() => Role, (role) => role.menus)
  roles: Role[];
}
