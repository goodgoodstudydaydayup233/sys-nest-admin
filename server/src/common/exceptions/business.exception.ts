/**
 * 业务异常类
 *
 * 功能：用于在业务逻辑中手动抛出自定义错误
 *
 * 使用方式：
 * import { BusinessException } from '../common/exceptions/business.exception';
 * import { ErrorCodeEnum } from '../common/enums/error-code.enum';
 *
 * // 抛出业务异常
 * throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
 * // 返回: { code: 1001, message: "用户不存在", data: null }
 *
 * // 默认错误码为 500
 * throw new BusinessException('服务器内部错误');
 * // 返回: { code: 500, message: "服务器内部错误", data: null }
 *
 * 常见使用场景：
 * 1. 参数校验失败
 * 2. 业务规则不满足
 * 3. 资源不存在
 * 4. 权限不足
 * 5. 状态异常
 */
export class BusinessException extends Error {
  code: number;

  constructor(message: string, code: number = 500) {
    super(message);
    this.code = code;
    this.name = 'BusinessException';
  }
}
