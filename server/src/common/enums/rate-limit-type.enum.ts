/**
 * 限流类型枚举
 * @description 定义限流 key 的维度
 * - DEFAULT：默认维度，按"接口 + IP"限流（同一 IP 对同一接口的请求数）
 * - IP：纯 IP 维度，按"IP"限流（同一 IP 对所有接口的总请求数）
 * - USER：用户维度，按"用户 + 接口"限流（同一登录用户对同一接口的请求数）
 */
export enum RateLimitType {
  /** 默认：按"接口 + IP"维度限流 */
  DEFAULT = 'DEFAULT',
  /** 按 IP 维度限流（单 IP 对所有接口的总请求数） */
  IP = 'IP',
  /** 按"用户 + 接口"维度限流（需登录） */
  USER = 'USER',
}
