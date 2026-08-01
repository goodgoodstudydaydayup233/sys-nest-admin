import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * 登录日志实体
 * @description 对标若依 sys_logininfor，记录用户登录行为（成功/失败）
 *
 * @字段说明
 * - userName: 登录账号（失败时也记录用户输入的账号）
 * - ipaddr: 登录IP
 * - loginLocation: 登录地点（IP归属地，本系统暂留空）
 * - browser: 浏览器类型
 * - os: 操作系统
 * - status: 登录状态 0-成功 1-失败
 * - msg: 提示消息（如"登录成功"/"密码错误"/"用户不存在"）
 * - loginTime: 登录时间
 */
@Entity('sys_logininfor')
export class LoginLog {
  @PrimaryGeneratedColumn({ comment: '访问ID' })
  id: number;

  @Column({ length: 50, default: '', comment: '用户账号' })
  userName: string;

  @Column({ length: 128, default: '', comment: '登录IP地址' })
  ipaddr: string;

  @Column({ length: 255, default: '', comment: '登录地点' })
  loginLocation: string;

  @Column({ length: 50, default: '', comment: '浏览器类型' })
  browser: string;

  @Column({ length: 50, default: '', comment: '操作系统' })
  os: string;

  @Column({ type: 'char', length: 1, default: '0', comment: '登录状态: 0-成功 1-失败' })
  status: string;

  @Column({ length: 255, default: '', comment: '提示消息' })
  msg: string;

  @CreateDateColumn({ comment: '登录时间' })
  loginTime: Date;
}
