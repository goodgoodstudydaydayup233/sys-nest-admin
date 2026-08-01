import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FieldGroup } from './field-group.entity';
import { DictData } from './dict-data.entity';

@Entity('sys_dict_type')
export class DictType extends BaseEntity {
  @Column({ length: 100, comment: '字典名称' })
  name: string;

  @Column({ length: 100, unique: true, comment: '字典类型' })
  type: string;

  @Column({ name: 'group_id', type: 'int', nullable: true, comment: '所属分组ID（不分组时为 NULL）' })
  groupId: number | null;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'char', length: 1, default: '1', comment: '状态: 0-禁用 1-启用' })
  status: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @ManyToOne(() => FieldGroup, (group) => group.dictTypes)
  @JoinColumn({ name: 'group_id' })
  group: FieldGroup;

  @OneToMany(() => DictData, (data) => data.dictType)
  dictData: DictData[];
}
