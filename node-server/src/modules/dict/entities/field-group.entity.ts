import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DictType } from './dict-type.entity';

@Entity('sys_field_group')
export class FieldGroup extends BaseEntity {
  @Column({ length: 100, comment: '分组名称' })
  name: string;

  @Column({ length: 100, unique: true, comment: '分组编码' })
  code: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'char', length: 1, default: '1', comment: '状态: 0-禁用 1-启用' })
  status: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => DictType, (dictType) => dictType.group)
  dictTypes: DictType[];
}
