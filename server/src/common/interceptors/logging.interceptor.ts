import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request } from 'express';
import { LogService } from '../../modules/log/log.service';
import { Reflector } from '@nestjs/core';
import { LOG_METADATA_KEY, LogMetadata } from '../decorators/log.decorator';

/**
 * 操作日志全局拦截器
 * @description 对标若依 LogAspect AOP 切面。只有标注了 @Log 装饰器的 Controller 方法才会记录操作日志。
 *
 * 记录内容：
 * - title / businessType：来自 @Log 装饰器元数据
 * - method：Controller 类名.方法名
 * - requestMethod：HTTP 请求方式（GET/POST/PUT/DELETE）
 * - operName：当前登录用户名
 * - operUrl / operIp / operParam：请求 URL、IP、参数（query+params+body）
 * - jsonResult：响应数据（截断 2000 字符）
 * - status：0-正常 1-异常
 * - errorMsg：异常消息
 * - costTime：请求耗时(ms)
 *
 * 日志记录异步执行，失败不影响主流程。
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logService: LogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 仅在方法或类上标注了 @Log 时才记录
    const metadata = this.reflector.getAllAndOverride<LogMetadata>(LOG_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const body: unknown = request.body;
    const query: unknown = request.query;
    const params: unknown = request.params;
    const user = request.user;
    const startTime = Date.now();

    // 组装方法名：Controller 类名.方法名
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const methodFullName = `${className}.${handlerName}()`;

    // 组装请求参数（合并 query + params + body，截断 2000 字符）
    const requestParam = this.stringifyParam({ query, params, body });

    // 客户端 IP
    const clientIp = this.getClientIp(request);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const costTime = Date.now() - startTime;
          this.logService.asyncCreate({
            title: metadata.title,
            businessType: metadata.businessType,
            method: methodFullName,
            requestMethod: method,
            operName: user?.username || 'anonymous',
            operUrl: url,
            operIp: clientIp,
            operLocation: '',
            operParam: requestParam,
            jsonResult: this.stringifyResult(data),
            status: '0', // 0 = 正常
            errorMsg: '',
            costTime,
          });
        },
      }),
      catchError((error: unknown) => {
        const costTime = Date.now() - startTime;
        this.logService.asyncCreate({
          title: metadata.title,
          businessType: metadata.businessType,
          method: methodFullName,
          requestMethod: method,
          operName: user?.username || 'anonymous',
          operUrl: url,
          operIp: clientIp,
          operLocation: '',
          operParam: requestParam,
          jsonResult: '',
          status: '1', // 1 = 异常
          errorMsg: error instanceof Error ? error.message : String(error),
          costTime,
        });
        return throwError(() => error);
      }),
    );
  }

  /** 序列化请求参数，截断过长内容 */
  private stringifyParam(param: unknown): string {
    try {
      const str = JSON.stringify(param);
      return str.length > 2000 ? str.substring(0, 2000) : str;
    } catch {
      return '';
    }
  }

  /** 序列化响应结果，截断过长内容 */
  private stringifyResult(data: unknown): string {
    try {
      const str = JSON.stringify(data);
      return str.length > 2000 ? str.substring(0, 2000) : str;
    } catch {
      return '';
    }
  }

  /** 获取客户端真实 IP */
  private getClientIp(request: Request): string {
    const headers = request.headers;
    const xForwardedFor = headers['x-forwarded-for'];
    const forwarded = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    const xRealIp = headers['x-real-ip'];
    const realIp = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    return forwarded?.split(',')[0]?.trim() || realIp || request.ip || '';
  }
}
