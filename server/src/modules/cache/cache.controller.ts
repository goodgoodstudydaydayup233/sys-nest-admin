import { Controller, Get, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheMonitorVo, CacheNameVo, CacheContentVo } from './vo/cache.vo';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';

/**
 * 缓存监控控制器
 * @description 提供缓存监控与缓存列表能力
 *
 * @路由前缀 /{dev-api|prod-api}/cache
 *
 * @接口分组
 * 1. 缓存监控（cache/index.vue）
 *    - GET /cache              获取 Redis 监控信息（info + dbSize + 命令统计）
 *
 * 2. 缓存列表（cacheList/index.vue，按业务前缀分组三栏）
 *    - GET    /cache/names                获取缓存名称列表（左栏）
 *    - GET    /cache/keys/:cacheName      获取指定缓存名称下的 key 列表（中栏）
 *    - GET    /cache/value                获取缓存内容（右栏）
 *    - DELETE /cache/clearCacheName/:cacheName  清理指定缓存名称下所有 key
 *    - DELETE /cache/clearCacheKey        清理指定 key
 *    - DELETE /cache/clearCacheAll        清理所有业务缓存
 */
@ApiTags('缓存监控')
@Controller('cache')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  // ==================== 缓存监控 ====================

  @Get()
  @ApiOperation({ summary: '获取 Redis 监控信息' })
  @ApiResponse({ status: 200, description: '成功', type: CacheMonitorVo })
  @Permission('monitor:cache:list')
  async getMonitorInfo(): Promise<CacheMonitorVo> {
    return this.cacheService.getMonitorInfo();
  }

  // ==================== 缓存列表 ====================

  @Get('names')
  @ApiOperation({ summary: '获取缓存名称列表' })
  @ApiResponse({ status: 200, description: '成功', type: [CacheNameVo] })
  @Permission('monitor:cache:list')
  getCacheNames(): CacheNameVo[] {
    return this.cacheService.getCacheNames();
  }

  @Get('keys/:cacheName')
  @ApiOperation({ summary: '获取指定缓存名称下的 key 列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('monitor:cache:list')
  async getCacheKeys(@Param('cacheName') cacheName: string): Promise<string[]> {
    return this.cacheService.getCacheKeysByCacheName(cacheName);
  }

  @Get('value')
  @ApiOperation({ summary: '获取缓存内容' })
  @ApiResponse({ status: 200, description: '成功', type: CacheContentVo })
  @Permission('monitor:cache:list')
  async getCacheContent(
    @Query('cacheName') cacheName: string,
    @Query('cacheKey') cacheKey: string,
  ): Promise<CacheContentVo> {
    return this.cacheService.getCacheContent(cacheName, cacheKey);
  }

  @Delete('clearCacheName/:cacheName')
  @ApiOperation({ summary: '清理指定缓存名称下所有 key' })
  @Permission('monitor:cache:remove')
  @Log('缓存列表', BusinessType.CLEAN)
  async clearCacheName(@Param('cacheName') cacheName: string): Promise<void> {
    await this.cacheService.clearCacheName(cacheName);
  }

  @Delete('clearCacheKey')
  @ApiOperation({ summary: '清理指定缓存 key' })
  @Permission('monitor:cache:remove')
  @Log('缓存列表', BusinessType.CLEAN)
  async clearCacheKey(@Query('cacheName') cacheName: string, @Query('cacheKey') cacheKey: string): Promise<void> {
    await this.cacheService.clearCacheKey(cacheName, cacheKey);
  }

  @Delete('clearCacheAll')
  @ApiOperation({ summary: '清理所有业务缓存' })
  @Permission('monitor:cache:remove')
  @Log('缓存列表', BusinessType.CLEAN)
  async clearCacheAll(): Promise<void> {
    await this.cacheService.clearCacheAll();
  }
}
