package com.sysnest.admin.modules.cache.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.cache.service.CacheService;
import com.sysnest.admin.modules.cache.vo.CacheContentVo;
import com.sysnest.admin.modules.cache.vo.CacheMonitorVo;
import com.sysnest.admin.modules.cache.vo.CacheNameVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 缓存监控接口，对应 Nest 的 cache.controller.ts
 */
@RestController
@RequestMapping("/cache")
@RequiredArgsConstructor
@Tag(name = "缓存监控")
public class CacheController {

    private final CacheService cacheService;

    @GetMapping
    @Operation(summary = "获取 Redis 监控信息")
    @PreAuthorize("@perm.has('monitor:cache:list')")
    public Result<CacheMonitorVo> monitor() {
        return Result.ok(cacheService.getMonitorInfo());
    }

    @GetMapping("/names")
    @Operation(summary = "获取缓存名称列表")
    @PreAuthorize("@perm.has('monitor:cache:list')")
    public Result<List<CacheNameVo>> names() {
        return Result.ok(cacheService.getCacheNames());
    }

    @GetMapping("/keys/{cacheName}")
    @Operation(summary = "获取指定缓存名称下的 key 列表")
    @PreAuthorize("@perm.has('monitor:cache:list')")
    public Result<List<String>> keys(@PathVariable String cacheName) {
        return Result.ok(cacheService.getCacheKeysByCacheName(cacheName));
    }

    @GetMapping("/value")
    @Operation(summary = "获取缓存内容")
    @PreAuthorize("@perm.has('monitor:cache:list')")
    public Result<CacheContentVo> value(@RequestParam String cacheName, @RequestParam String cacheKey) {
        return Result.ok(cacheService.getCacheContent(cacheName, cacheKey));
    }

    @DeleteMapping("/clearCacheName/{cacheName}")
    @Operation(summary = "清理指定缓存名称下所有 key")
    @PreAuthorize("@perm.has('monitor:cache:remove')")
    @OperLog(title = "缓存列表", businessType = "9")
    public Result<Void> clearCacheName(@PathVariable String cacheName) {
        cacheService.clearCacheName(cacheName);
        return Result.ok();
    }

    @DeleteMapping("/clearCacheKey")
    @Operation(summary = "清理指定缓存 key")
    @PreAuthorize("@perm.has('monitor:cache:remove')")
    @OperLog(title = "缓存列表", businessType = "9")
    public Result<Void> clearCacheKey(@RequestParam String cacheName, @RequestParam String cacheKey) {
        cacheService.clearCacheKey(cacheName, cacheKey);
        return Result.ok();
    }

    @DeleteMapping("/clearCacheAll")
    @Operation(summary = "清理所有业务缓存")
    @PreAuthorize("@perm.has('monitor:cache:remove')")
    @OperLog(title = "缓存列表", businessType = "9")
    public Result<Void> clearCacheAll() {
        cacheService.clearCacheAll();
        return Result.ok();
    }
}
