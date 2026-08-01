import { Injectable } from '@nestjs/common';
import { AuthCacheService } from '../auth/auth-cache.service';
import { QueryOnlineDto } from './dto/query-online.dto';
import { OnlineUserVo } from './vo/online-user.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

/**
 * 在线用户服务
 * @description 基于 Redis 提供：
 *
 * 1. 列出在线用户：扫描 online:token:* 前缀所有 key，返回用户/IP/UA/登录时间
 * 2. 强退用户：删除该 token 的在线记录 + 加入 token 黑名单（使该 token 立即失效）
 *
 * @数据来源
 * 用户登录时（auth.service.login / refresh）会按 token 维度写入 Redis：
 *   key:   online:token:{token}
 *   value: { tokenId, userId, username, nickname, ipaddr, browser, os, loginTime }
 *   TTL:   token 剩余有效期（自动过期，无需手动清理）
 */
@Injectable()
export class OnlineService {
  constructor(private readonly authCacheService: AuthCacheService) {}

  /**
   * 查询在线用户列表
   * @param query 筛选条件（用户名、IP，模糊匹配）
   * @returns 在线用户列表（按登录时间倒序）
   */
  async list(query: QueryOnlineDto): Promise<OnlineUserVo[]> {
    const all = await this.authCacheService.scanOnlineUsers();
    let list = all as OnlineUserVo[];

    // 用户名模糊筛选
    if (query.username) {
      const kw = query.username.toLowerCase();
      list = list.filter((item) => item.username?.toLowerCase().includes(kw));
    }
    // IP 模糊筛选
    if (query.ipaddr) {
      const kw = query.ipaddr.toLowerCase();
      list = list.filter((item) => item.ipaddr?.toLowerCase().includes(kw));
    }

    // 按登录时间倒序（最新的在前）
    return list.sort((a, b) => {
      const ta = a.loginTime ? new Date(a.loginTime).getTime() : 0;
      const tb = b.loginTime ? new Date(b.loginTime).getTime() : 0;
      return tb - ta;
    });
  }

  /**
   * 强退用户（使指定 token 立即失效）
   * @description
   * 1. 校验该 token 是否确实在线（不存在则提示已下线）
   * 2. 将 token 加入黑名单（jwt 策略下次校验时拒绝）
   * 3. 删除该 token 的在线记录
   * @param tokenId access token
   */
  async forceLogout(tokenId: string): Promise<void> {
    const online = await this.authCacheService.getOnlineUser(tokenId);
    if (!online) {
      throw new BusinessException('该用户已下线', ErrorCodeEnum.PARAM_ERROR);
    }
    // 加入黑名单（默认 TTL 覆盖 token 剩余有效期即可，token 过期后黑名单 key 自动清除）
    await this.authCacheService.addToTokenBlacklist(tokenId);
    // 移除在线记录
    await this.authCacheService.removeOnlineUser(tokenId);
  }
}
