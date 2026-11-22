package com.sysnest.admin.modules.cache.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 缓存名称（缓存列表左栏）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CacheNameVo {

    /** 缓存名称（业务标识） */
    private String cacheName;

    /** 备注说明 */
    private String remark;
}
