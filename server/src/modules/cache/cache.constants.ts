import { AppConfigService } from '../../core/config/config.service';

/**
 * 缓存名称定义
 * @description 将业务缓存按前缀分组，供缓存列表页三栏展示
 *
 * @设计说明
 * "缓存列表"按业务模块（缓存名称）组织，而非按 Redis db 切换。
 * 每个缓存名称对应一个 Redis key 前缀，例如 sys_config 对应 config:* 下所有 key。
 * 这样业务上更直观：左侧选"参数配置"，中间列出所有配置缓存，右侧看内容。
 */
export interface CacheNameDefinition {
  /** 缓存名称（业务标识，如 sys_config） */
  cacheName: string;
  /** Redis key 前缀（如 config:） */
  prefix: string;
  /** 备注说明 */
  remark: string;
}

/**
 * 获取预定义的缓存名称列表
 * @description 基于 AppConfigService.redisKeys 动态生成，保证与实际使用的前缀一致
 *
 * @缓存名称对照
 * - sys_user_info      用户信息缓存      前缀 user:info:
 * - sys_captcha        验证码缓存        前缀 captcha:
 * - sys_token_blacklist Token 黑名单     前缀 token:blacklist:
 * - sys_dict           字典数据缓存      前缀 dict:data:
 * - sys_config         参数配置缓存      前缀 config:
 * - sys_online_user    在线用户缓存      前缀 online:token:
 */
export function getCacheNameDefinitions(configService: AppConfigService): CacheNameDefinition[] {
  const redisKeys = configService.redisKeys;
  return [
    {
      cacheName: 'sys_user_info',
      prefix: redisKeys.user.prefix,
      remark: '用户信息缓存',
    },
    {
      cacheName: 'sys_captcha',
      prefix: redisKeys.captcha.prefix,
      remark: '验证码缓存',
    },
    {
      cacheName: 'sys_token_blacklist',
      prefix: redisKeys.tokenBlacklist.prefix,
      remark: 'Token 黑名单',
    },
    {
      cacheName: 'sys_dict',
      prefix: redisKeys.dict.prefix,
      remark: '字典数据缓存',
    },
    {
      cacheName: 'sys_config',
      prefix: redisKeys.config.prefix,
      remark: '参数配置缓存',
    },
    {
      cacheName: 'sys_online_user',
      prefix: redisKeys.online.prefix,
      remark: '在线用户缓存',
    },
  ];
}
