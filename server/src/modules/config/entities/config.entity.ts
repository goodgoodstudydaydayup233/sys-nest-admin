import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('sys_config')
export class Config extends BaseEntity {
  @Column({ length: 100, comment: '配置键' })
  configKey: string;

  @Column({ length: 500, comment: '配置值' })
  configValue: string;

  @Column({ length: 100, comment: '配置名称' })
  name: string;

  @Column({ length: 50, default: 'system', comment: '配置分组' })
  group: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
