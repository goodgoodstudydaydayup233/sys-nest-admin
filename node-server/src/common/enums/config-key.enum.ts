/**
 * 系统配置键名枚举
 *
 * 对应 sys_config 表中的 configKey 字段，统一管理配置键名，避免硬编码。
 */
export enum ConfigKeyEnum {
  /** 登录验证码开关 (true/false) */
  LOGIN_CAPTCHA_ENABLED = 'sys.login.captchaEnabled',

  /** 登录最大重试次数 */
  LOGIN_MAX_RETRY_COUNT = 'sys.login.maxRetryCount',

  /** 登录锁定时间（分钟） */
  LOGIN_LOCK_TIME = 'sys.login.lockTime',

  /** 用户默认密码 */
  USER_DEFAULT_PASSWORD = 'sys.user.defaultPassword',

  /** 上传文件大小限制（MB） */
  UPLOAD_MAX_SIZE = 'sys.upload.maxSize',
}
