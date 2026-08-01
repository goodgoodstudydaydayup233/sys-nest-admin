import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 操作日志实体
 * @description 记录系统操作行为
 */
@Entity('sys_oper_log')
export class OperationLog extends BaseEntity {
  @Column({ length: 50, default: '', comment: '模块标题' })
  title: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '业务类型: 0-其它 1-新增 2-修改 3-删除 4-授权 5-导出 6-导入 7-强退 8-生成代码 9-清空数据' })
  businessType: string;

  @Column({ length: 200, default: '', comment: '方法名称' })
  method: string;

  @Column({ length: 10, default: '', comment: '请求方式' })
  requestMethod: string;

  @Column({ length: 50, default: '', comment: '操作人员' })
  operName: string;

  @Column({ length: 500, default: '', comment: '请求URL' })
  operUrl: string;

  @Column({ length: 128, default: '', comment: '主机地址' })
  operIp: string;

  @Column({ length: 255, default: '', comment: '操作地点' })
  operLocation: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数' })
  operParam: string;

  @Column({ type: 'text', nullable: true, comment: '返回参数' })
  jsonResult: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '操作状态: 0-正常 1-异常' })
  status: string;

  @Column({ type: 'text', nullable: true, comment: '错误消息' })
  errorMsg: string;

  @Column({ type: 'bigint', default: 0, comment: '消耗时间(ms)' })
  costTime: number;
}
