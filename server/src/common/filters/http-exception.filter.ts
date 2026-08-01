import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP 异常过滤器
 *
 * 功能：捕获 NestJS 内置的 HttpException（如 401、403、404、500 等）
 *
 * 响应格式：
 * {
 *   code: 401,              // HTTP 状态码
 *   message: "Unauthorized", // 错误信息
 *   data: null
 * }
 *
 * 使用方式：
 * 在 main.ts 中注册为全局过滤器：
 * app.useGlobalFilters(new HttpExceptionFilter());
 *
 * 常见触发场景：
 * 1. JwtAuthGuard 认证失败 → 401
 * 2. PermissionGuard 权限不足 → 403
 * 3. 路由不存在 → 404
 * 4. 请求参数类型错误 → 400
 *
 * 注意：
 * - BusinessException 由 BusinessExceptionFilter 处理，不会进入此过滤器
 * - 此过滤器主要处理框架层面的 HTTP 错误
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      code: status,
      msg: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'error',
      data: null,
    });
  }
}
