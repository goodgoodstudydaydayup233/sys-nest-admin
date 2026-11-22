/**
 * 操作日志业务类型枚举
 * @description 用于标识操作的业务类别
 *
 * @枚举值
 * - OTHER('0'): 其它
 * - INSERT('1'): 新增
 * - UPDATE('2'): 修改
 * - DELETE('3'): 删除
 * - GRANT('4'): 授权
 * - EXPORT('5'): 导出
 * - IMPORT('6'): 导入
 * - FORCE('7'): 强退
 * - GENCODE('8'): 生成代码
 * - CLEAN('9'): 清空数据
 *
 * @使用示例
 * ```ts
 * @Log('用户管理', BusinessType.INSERT)
 * @Post()
 * async create() { ... }
 * ```
 */
export enum BusinessType {
  /** 其它 */
  OTHER = '0',
  /** 新增 */
  INSERT = '1',
  /** 修改 */
  UPDATE = '2',
  /** 删除 */
  DELETE = '3',
  /** 授权 */
  GRANT = '4',
  /** 导出 */
  EXPORT = '5',
  /** 导入 */
  IMPORT = '6',
  /** 强退 */
  FORCE = '7',
  /** 生成代码 */
  GENCODE = '8',
  /** 清空数据 */
  CLEAN = '9',
}
