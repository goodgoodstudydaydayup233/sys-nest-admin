import { Injectable, Logger } from '@nestjs/common';

/**
 * 示例定时任务 Bean（RyTask）
 * @description 演示无参、单参、多参任务的调用方式。
 * 调用目标字符串格式：`beanName.method(arg1, arg2, ...)`，如 `ryTask.ryParams('ry')`
 *
 * @example
 * ```ts
 * // 注册为 provider：{ provide: 'ryTask', useClass: SampleTask }
 * // 调用：ryTask.ryNoParams()
 * // 调用：ryTask.ryParams('ry')
 * // 调用：ryTask.ryMultipleParams('ry', 1, true)
 * ```
 */
@Injectable()
export class SampleTask {
  private readonly logger = new Logger(SampleTask.name);

  /** 无参任务 */
  ryNoParams(): string {
    this.logger.log('执行无参示例任务：ryNoParams');
    return 'ryNoParams 执行成功';
  }

  /** 单参任务 */
  ryParams(param: string): string {
    this.logger.log(`执行单参示例任务：ryParams(${param})`);
    return `ryParams(${param}) 执行成功`;
  }

  /** 多参任务 */
  ryMultipleParams(s: string, n: number, b: boolean): string {
    this.logger.log(`执行多参示例任务：ryMultipleParams(${s}, ${n}, ${b})`);
    return `ryMultipleParams(${s}, ${n}, ${b}) 执行成功`;
  }

  /** 字符串参任务 */
  ryString(str: string): string {
    this.logger.log(`执行字符串参示例任务：ryString(${str})`);
    return `ryString(${str}) 执行成功`;
  }
}
