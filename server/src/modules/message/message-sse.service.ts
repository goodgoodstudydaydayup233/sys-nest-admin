import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';

/**
 * 站内信 SSE 连接管理服务
 * @description 维护「用户 -> SSE 连接」注册表，用于后端主动向在线用户推送站内信事件。
 *
 * 设计要点：
 * - 同一用户可能打开多个标签页，因此按 userId 存放连接集合（Set<Response>）
 * - 连接关闭（req close）时自动从注册表移除，避免内存泄漏
 * - 未推送时通过控制器层的心跳（: keep-alive）保持连接不被代理断开
 *
 * @example 发送站内信后向接收人推送
 * ```typescript
 * this.messageSseService.sendToUsers([1, 2], 'new-message', { count: 2 })
 * ```
 */
@Injectable()
export class MessageSseService {
  private readonly logger = new Logger(MessageSseService.name);

  /** 已连接用户注册表：userId -> 该用户所有活动连接 */
  private readonly clients = new Map<number, Set<Response>>();

  /**
   * 注册一个 SSE 连接
   * @param userId 用户 ID
   * @param res Express Response（须已设置 text/event-stream 头）
   */
  addClient(userId: number, res: Response): void {
    let set = this.clients.get(userId);
    if (!set) {
      set = new Set();
      this.clients.set(userId, set);
    }
    set.add(res);

    // 连接断开时清理，避免内存泄漏
    res.on('close', () => this.removeClient(userId, res));
  }

  /**
   * 移除指定用户的某个连接
   * @param userId 用户 ID
   * @param res 待移除的 Response
   */
  private removeClient(userId: number, res: Response): void {
    const set = this.clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      this.clients.delete(userId);
    }
  }

  /**
   * 向指定用户的所有连接推送事件
   * @param userId 用户 ID
   * @param event 事件名（前端通过 addEventListener(event) 监听）
   * @param data 推送数据（自动 JSON 序列化）
   */
  send(userId: number, event: string, data: unknown): void {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    let payload: string;
    try {
      payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    } catch {
      this.logger.warn(`[SSE] 推送数据序列化失败: ${event}`);
      return;
    }

    for (const res of set) {
      try {
        res.write(payload);
      } catch (error) {
        this.logger.warn(`[SSE] 推送失败 userId=${userId}: ${(error as Error).message}`);
        this.removeClient(userId, res);
      }
    }
  }

  /**
   * 批量向多个用户推送事件（发送站内信后调用）
   * @param userIds 用户 ID 列表
   * @param event 事件名
   * @param data 推送数据
   */
  sendToUsers(userIds: number[], event: string, data: unknown): void {
    for (const userId of userIds) {
      this.send(userId, event, data);
    }
  }
}
