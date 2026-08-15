import type { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

/**
 * 全局访问日志中间件
 * @description 监听所有 HTTP 请求（含未认证/404 请求），在响应结束时记录：
 * 请求方法、完整路径、状态码、客户端 IP、操作人、耗时、UA。
 *
 * 使用 res 'finish' 事件保证拿到最终状态码；耗时统计从请求进入开始。
 * 该中间件注册在所有守卫之前，因此 401/403/404 也会被完整记录。
 *
 * @使用示例（main.ts）
 * ```ts
 * app.use(createAccessLogMiddleware(fileLogger));
 * ```
 */
export function createAccessLogMiddleware(logger: FileLoggerService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const cost = Date.now() - start;
      logger.access({
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        ip: getClientIp(req),
        user: req.user?.username || '',
        cost,
        ua: (req.get('user-agent') || '').slice(0, 200),
        message: `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
      });
    });

    next();
  };
}

/** 获取客户端真实 IP（优先 x-forwarded-for 链首个） */
function getClientIp(req: Request): string {
  const headers = req.headers;
  const xForwardedFor = headers['x-forwarded-for'];
  const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
  const xRealIp = headers['x-real-ip'];
  const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  return forwarded?.split(',')[0]?.trim() || realIp || req.ip || '';
}
