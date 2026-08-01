import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Redis 监控信息视图对象
 * @description 对标若依 CacheVo，包含 Redis 信息、dbSize、命令统计
 */
export class CacheMonitorVo {
  @ApiProperty({ description: 'Redis INFO 分组信息' })
  info: Record<string, Record<string, string>>;

  @ApiProperty({ description: '当前 db 的 key 数量' })
  dbSize: number;

  @ApiProperty({ description: '命令执行统计（用于饼图）' })
  commandStats: { name: string; value: string }[];
}

/**
 * 缓存 key 列表项
 */
export class CacheKeyVo {
  @ApiProperty({ description: 'key 名' })
  key: string;

  @ApiProperty({ description: 'TTL 秒数：-1 永不过期，-2 已过期' })
  ttl: number;
}

/**
 * 缓存 value 详情
 */
export class CacheValueVo {
  @ApiProperty({ description: 'key 名' })
  key: string;

  @ApiProperty({ description: '数据类型: string/list/hash/set/zset' })
  type: string;

  @ApiProperty({ description: '值（复杂类型已 JSON 序列化）' })
  value: string;

  @ApiProperty({ description: 'TTL 秒数' })
  ttl: number;
}

/**
 * 缓存名称视图对象
 * @description 对标若依缓存列表左栏，按业务前缀分组的缓存名称
 */
export class CacheNameVo {
  @ApiProperty({ description: '缓存名称（业务标识）' })
  cacheName: string;

  @ApiProperty({ description: '备注说明' })
  remark: string;
}

/**
 * 缓存内容详情
 * @description 对标若依缓存列表右栏，展示缓存名称、键名、值
 */
export class CacheContentVo {
  @ApiProperty({ description: '缓存名称' })
  cacheName: string;

  @ApiProperty({ description: '缓存键名（完整）' })
  cacheKey: string;

  @ApiProperty({ description: '数据类型' })
  type: string;

  @ApiProperty({ description: '缓存内容（复杂类型已 JSON 序列化）' })
  cacheValue: string;

  @ApiProperty({ description: 'TTL 秒数' })
  ttl: number;
}
