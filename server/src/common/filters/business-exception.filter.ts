import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 业务异常过滤器
 *
 * 功能：捕获 BusinessException，返回统一的错误响应格式
 *
 * 响应格式：
 * {
 *   code: 1001,           // 错误码（来自 ErrorCodeEnum）
 *   message: "用户不存在", // 错误信息
 *   data: null
 * }
 *
 * 使用方式：
 * 在 main.ts 中注册为全局过滤器：
 * app.useGlobalFilters(new BusinessExceptionFilter());
 *
 * 在业务代码中抛出异常：
 *
 * // 用户模块示例
 * const user = await this.userService.findByUsername(username);
 * if (!user) {
 *   throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
 * }
 *
 * // 权限模块示例
 * if (!hasPermission) {
 *   throw new BusinessException('没有操作权限', ErrorCodeEnum.NO_PERMISSION);
 * }
 *
 * // 验证码模块示例
 * if (!isValid) {
 *   throw new BusinessException('验证码错误', ErrorCodeEnum.CAPTCHA_ERROR);
 * }
 */
@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // HTTP 状态码始终返回 200，业务错误码在 body.code 中体现
    response.status(200).json({
      code: exception.code,
      msg: exception.message,
      data: null,
    });
  }
}
