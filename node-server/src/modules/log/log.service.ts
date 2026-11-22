import { Injectable } from '@nestjs/common';
import { LogRepository } from './log.repository';
import { QueryLogDto } from './dto/query-log.dto';
import { OperationLog } from './entities/operation-log.entity';
import { LogVo, LogListVo } from './vo/log.vo';

/**
 * 操作日志服务
 * @description 提供操作日志的查询、删除、清空能力，
 * 并供 LoggingInterceptor 调用以异步记录操作日志。
 */
@Injectable()
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  async findById(id: number): Promise<LogVo | null> {
    const log = await this.logRepository.findById(id);
    return log ? this.toLogVo(log) : null;
  }

  async findAll(query: QueryLogDto): Promise<LogListVo> {
    const { list, total } = await this.logRepository.findAll(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    return {
      list: list.map((log) => this.toLogVo(log)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 异步记录操作日志
   * @description 由 LoggingInterceptor 调用，不阻塞主流程，异常时仅打印日志
   */
  async asyncCreate(log: Partial<OperationLog>): Promise<void> {
    try {
      await this.logRepository.create(log);
    } catch (e) {
      // 日志记录失败不应影响主流程
      console.error('[LogService] 操作日志记录失败:', e?.message);
    }
  }

  async remove(ids: number[]): Promise<void> {
    await this.logRepository.remove(ids);
  }

  async clear(): Promise<void> {
    await this.logRepository.clear();
  }

  private toLogVo(log: OperationLog): LogVo {
    return {
      id: log.id,
      title: log.title,
      businessType: log.businessType,
      method: log.method,
      requestMethod: log.requestMethod,
      operName: log.operName,
      operUrl: log.operUrl,
      operIp: log.operIp,
      operLocation: log.operLocation,
      operParam: log.operParam,
      jsonResult: log.jsonResult,
      status: log.status,
      errorMsg: log.errorMsg,
      costTime: log.costTime,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}
