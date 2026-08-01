import { Injectable } from '@nestjs/common';
import { LoginLogRepository } from './login-log.repository';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { LoginLog } from './entities/login-log.entity';
import { LoginLogVo, LoginLogListVo } from './vo/login-log.vo';

/**
 * 登录日志服务
 * @description 提供登录日志的查询、删除、清空能力，
 * 并供 AuthService 调用以异步记录登录日志。
 */
@Injectable()
export class LoginLogService {
  constructor(private readonly loginLogRepository: LoginLogRepository) {}

  async findById(id: number): Promise<LoginLogVo | null> {
    const log = await this.loginLogRepository.findById(id);
    return log ? this.toVo(log) : null;
  }

  async findAll(query: QueryLoginLogDto): Promise<LoginLogListVo> {
    const { list, total } = await this.loginLogRepository.findAll(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    return {
      list: list.map((log) => this.toVo(log)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 异步记录登录日志
   * @description 由 AuthService 调用，不阻塞登录主流程，异常时仅打印日志
   * @param log 日志信息（userName/ipaddr/browser/os/status/msg）
   */
  async asyncCreate(log: Partial<LoginLog>): Promise<void> {
    try {
      await this.loginLogRepository.create(log);
    } catch (e) {
      // 日志记录失败不应影响主流程
      console.error('[LoginLogService] 登录日志记录失败:', e?.message);
    }
  }

  async remove(ids: number[]): Promise<void> {
    await this.loginLogRepository.remove(ids);
  }

  async clear(): Promise<void> {
    await this.loginLogRepository.clear();
  }

  private toVo(log: LoginLog): LoginLogVo {
    return {
      id: log.id,
      userName: log.userName,
      ipaddr: log.ipaddr,
      loginLocation: log.loginLocation,
      browser: log.browser,
      os: log.os,
      status: log.status,
      msg: log.msg,
      loginTime: log.loginTime,
    };
  }
}
