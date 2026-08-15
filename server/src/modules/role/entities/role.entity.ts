import { Entity, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Menu } from '../../menu/entities/menu.entity';

@Entity('sys_role')
@Index(['name', 'deleteStatus'], { unique: true })
export class Role extends BaseEntity {
  @Column({ length: 50, comment: '角色名称' })
  name: string;

  @Column({ length: 50, default: '', comment: '角色编码' })
  code: string;

  @Column({ length: 100, nullable: true, comment: '权限标识' })
  permission: string;

  @Column({ type: 'char', length: 1, default: '1', comment: '状态: 0-禁用 1-启用' })
  status: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ManyToMany(() => Menu, (menu) => menu.roles)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus: Menu[];
}
