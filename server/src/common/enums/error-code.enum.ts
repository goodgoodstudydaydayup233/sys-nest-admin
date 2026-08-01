export enum ErrorCodeEnum {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,

  // 业务错误码 1xxx
  USER_NOT_FOUND = 1001,
  USER_PASSWORD_ERROR = 1002,
  USER_DISABLED = 1003,
  USER_ALREADY_EXISTS = 1004,
  USER_CANNOT_DELETE_ADMIN = 1005,
  USER_CANNOT_MODIFY_ADMIN = 1006,

  // 验证码错误码 2xxx
  CAPTCHA_EXPIRED = 2001,
  CAPTCHA_ERROR = 2002,

  // Token错误码 3xxx
  TOKEN_EXPIRED = 3001,
  TOKEN_INVALID = 3002,

  // 权限错误码 4xxx
  NO_PERMISSION = 4001,
  ROLE_NOT_FOUND = 4002,
  ROLE_ALREADY_EXISTS = 4003,

  // 配置错误码 6xxx
  CONFIG_NOT_FOUND = 6001,

  // 字典错误码 7xxx
  DICT_TYPE_ALREADY_EXISTS = 7001,
  DICT_GROUP_ALREADY_EXISTS = 7002,
  DICT_TYPE_NOT_FOUND = 7003,
  DICT_TYPE_IN_USE = 7004,
  DICT_DATA_NOT_FOUND = 7005,

  // 参数错误码 5xxx
  PARAM_ERROR = 5001,

  // 定时任务错误码 8xxx
  JOB_NOT_FOUND = 8001,
  JOB_CRON_INVALID = 8002,
  JOB_BEAN_NOT_FOUND = 8003,
  JOB_METHOD_NOT_FOUND = 8004,
  JOB_ALREADY_RUNNING = 8005,
}

export const ErrorMessageMap: Record<ErrorCodeEnum, string> = {
  [ErrorCodeEnum.SUCCESS]: '操作成功',
  [ErrorCodeEnum.BAD_REQUEST]: '请求参数错误',
  [ErrorCodeEnum.UNAUTHORIZED]: '未授权',
  [ErrorCodeEnum.FORBIDDEN]: '禁止访问',
  [ErrorCodeEnum.NOT_FOUND]: '资源不存在',
  [ErrorCodeEnum.INTERNAL_ERROR]: '服务器内部错误',

  [ErrorCodeEnum.USER_NOT_FOUND]: '用户不存在',
  [ErrorCodeEnum.USER_PASSWORD_ERROR]: '密码错误',
  [ErrorCodeEnum.USER_DISABLED]: '用户已被禁用',
  [ErrorCodeEnum.USER_ALREADY_EXISTS]: '用户已存在',
  [ErrorCodeEnum.USER_CANNOT_DELETE_ADMIN]: '超级管理员不可删除',
  [ErrorCodeEnum.USER_CANNOT_MODIFY_ADMIN]: '超级管理员不可操作',

  [ErrorCodeEnum.CAPTCHA_EXPIRED]: '验证码已过期',
  [ErrorCodeEnum.CAPTCHA_ERROR]: '验证码错误',

  [ErrorCodeEnum.TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCodeEnum.TOKEN_INVALID]: 'Token无效',

  [ErrorCodeEnum.NO_PERMISSION]: '没有权限',
  [ErrorCodeEnum.ROLE_NOT_FOUND]: '角色不存在',
  [ErrorCodeEnum.ROLE_ALREADY_EXISTS]: '角色已存在',

  [ErrorCodeEnum.CONFIG_NOT_FOUND]: '配置不存在',

  [ErrorCodeEnum.DICT_TYPE_ALREADY_EXISTS]: '字典类型已存在',
  [ErrorCodeEnum.DICT_GROUP_ALREADY_EXISTS]: '分组编码已存在',
  [ErrorCodeEnum.DICT_TYPE_NOT_FOUND]: '字典类型不存在',
  [ErrorCodeEnum.DICT_TYPE_IN_USE]: '字典类型已存在字典数据，无法删除',
  [ErrorCodeEnum.DICT_DATA_NOT_FOUND]: '字典数据不存在',

  [ErrorCodeEnum.PARAM_ERROR]: '参数错误',

  [ErrorCodeEnum.JOB_NOT_FOUND]: '定时任务不存在',
  [ErrorCodeEnum.JOB_CRON_INVALID]: 'cron表达式不合法',
  [ErrorCodeEnum.JOB_BEAN_NOT_FOUND]: '任务Bean不存在',
  [ErrorCodeEnum.JOB_METHOD_NOT_FOUND]: '任务方法不存在',
  [ErrorCodeEnum.JOB_ALREADY_RUNNING]: '任务正在执行，禁止并发',
};
