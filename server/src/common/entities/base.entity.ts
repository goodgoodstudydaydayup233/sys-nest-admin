import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @Column({ type: 'char', length: 1, default: '0', comment: '删除状态: 0-未删除 1-已删除' })
  deleteStatus: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '禁用状态: 0-启用 1-禁用' })
  disabled: string;

  @Column({ length: 50, nullable: true, comment: '创建者' })
  createdBy: string;

  @Column({ length: 50, nullable: true, comment: '更新者' })
  updatedBy: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
