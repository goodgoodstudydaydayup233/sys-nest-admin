import { Injectable, Logger } from '@nestjs/common';

/**
 * 示例定时任务 Bean（StTask）
 * @description 演示无参、单参、多参任务的调用方式。
 * 调用目标字符串格式：`beanName.method(arg1, arg2, ...)`，如 `stTask.stParams('st')`
 *
 * @example
 * ```ts
 * // 注册为 provider：{ provide: 'stTask', useClass: SampleTask }
 * // 调用：stTask.stNoParams()
 * // 调用：stTask.stParams('st')
 * // 调用：stTask.stMultipleParams('st', 1, true)
 * ```
 */
@Injectable()
export class SampleTask {
  private readonly logger = new Logger(SampleTask.name);

  /** 无参任务 */
  stNoParams(): string {
    this.logger.log('执行无参示例任务：stNoParams');
    return 'stNoParams 执行成功';
  }

  /** 单参任务 */
  stParams(param: string): string {
    this.logger.log(`执行单参示例任务：stParams(${param})`);
    return `stParams(${param}) 执行成功`;
  }

  /** 多参任务 */
  stMultipleParams(s: string, n: number, b: boolean): string {
    this.logger.log(`执行多参示例任务：stMultipleParams(${s}, ${n}, ${b})`);
    return `stMultipleParams(${s}, ${n}, ${b}) 执行成功`;
  }

  /** 字符串参任务 */
  stString(str: string): string {
    this.logger.log(`执行字符串参示例任务：stString(${str})`);
    return `stString(${str}) 执行成功`;
  }
}
