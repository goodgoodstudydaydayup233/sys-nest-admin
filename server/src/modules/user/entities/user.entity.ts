import { Entity, Column, ManyToMany, JoinTable, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('sys_user')
@Index(['username', 'deleteStatus'], { unique: true })
export class User extends BaseEntity {
  @Column({ length: 50, comment: '用户名' })
  username: string;

  @Column({ length: 100, comment: '密码' })
  password: string;

  @Column({ length: 50, nullable: true, comment: '昵称' })
  nickname: string;

  @Column({ length: 100, nullable: true, comment: '邮箱' })
  email: string;

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '头像' })
  avatar: string;

  @Column({ type: 'char', length: 1, default: '1', comment: '状态: 0-禁用 1-启用' })
  status: string;

  @Column({ type: 'char', length: 1, default: '3', comment: '性别: 0-男 1-女 3-未知' })
  sex: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'sys_user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
