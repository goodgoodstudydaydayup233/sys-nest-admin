package com.sysnest.admin.modules.cache.vo;

import lombok.Data;

/**
 * 缓存内容（缓存列表右栏）
 */
@Data
public class CacheContentVo {

    private String cacheName;
    private String cacheKey;
    private String type;
    private String cacheValue;
    private long ttl;
}
