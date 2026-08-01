import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DictType } from './dict-type.entity';

@Entity('sys_dict_data')
export class DictData extends BaseEntity {
  @Column({ length: 100, comment: '字典标签' })
  label: string;

  @Column({ length: 100, comment: '字典值' })
  value: string;

  @Column({ name: 'type_id', type: 'int', comment: '所属字典类型ID' })
  typeId: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '回显样式' })
  cssClass: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '标签类型: primary/success/danger/warning/info' })
  listClass: string;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'char', length: 1, default: '1', comment: '状态: 0-禁用 1-启用' })
  status: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @ManyToOne(() => DictType, (type) => type.dictData)
  @JoinColumn({ name: 'type_id' })
  dictType: DictType;
}
