package com.sysnest.admin.modules.cache.vo;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Redis 监控信息，字段与 Nest 端 CacheMonitorVo 一致
 */
@Data
public class CacheMonitorVo {

    /** Redis INFO 分组信息，如 { "Server": { "redis_version": "7.0.0" } } */
    private Map<String, Map<String, String>> info;

    /** 当前 db 的 key 数量 */
    private long dbSize;

    /** 命令执行统计 */
    private List<CommandStatVo> commandStats;
}
