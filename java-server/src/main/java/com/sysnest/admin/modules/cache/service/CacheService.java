package com.sysnest.admin.modules.cache.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.cache.vo.CacheContentVo;
import com.sysnest.admin.modules.cache.vo.CacheMonitorVo;
import com.sysnest.admin.modules.cache.vo.CacheNameVo;
import com.sysnest.admin.modules.cache.vo.CommandStatVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.DataType;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.zset.Tuple;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 缓存监控，对应 Nest 的 cache.service.ts
 *
 * 两部分能力：
 * 1. 缓存监控：Redis INFO、dbSize、命令统计
 * 2. 缓存列表：按业务前缀分组，支持查看/清理 key
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    /** 从 commandstats 的 calls=123 中提取次数 */
    private static final Pattern CALLS_PATTERN = Pattern.compile("calls=(\\d+)");

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisUtils redisUtils;
    private final ObjectMapper objectMapper;

    // ==================== 缓存监控 ====================

    public CacheMonitorVo getMonitorInfo() {
        return redisTemplate.execute((RedisCallback<CacheMonitorVo>) connection -> {
            CacheMonitorVo vo = new CacheMonitorVo();
            Map<String, Map<String, String>> info = new LinkedHashMap<>();
            Properties commandStatsProperties = null;

            String[][] sections = {
                    {"server", "Server"},
                    {"clients", "Clients"},
                    {"memory", "Memory"},
                    {"persistence", "Persistence"},
                    {"stats", "Stats"},
                    {"replication", "Replication"},
                    {"cpu", "CPU"},
                    {"commandstats", "Commandstats"},
                    {"keyspace", "Keyspace"}
            };

            for (String[] section : sections) {
                try {
                    Properties properties = connection.serverCommands().info(section[0]);
                    if (properties == null || properties.isEmpty()) {
                        continue;
                    }
                    Map<String, String> values = new LinkedHashMap<>();
                    properties.stringPropertyNames().stream().sorted()
                            .forEach(name -> values.put(name, properties.getProperty(name)));
                    info.put(section[1], values);
                    if ("commandstats".equals(section[0])) {
                        commandStatsProperties = properties;
                    }
                } catch (Exception e) {
                    log.warn("读取 Redis INFO[{}] 失败：{}", section[0], e.getMessage());
                }
            }

            Long dbSize = connection.serverCommands().dbSize();
            vo.setInfo(info);
            vo.setDbSize(dbSize == null ? 0 : dbSize);
            vo.setCommandStats(parseCommandStats(commandStatsProperties));
            return vo;
        });
    }

    private List<CommandStatVo> parseCommandStats(Properties properties) {
        List<CommandStatVo> stats = new ArrayList<>();
        if (properties == null) {
            return stats;
        }
        for (String name : properties.stringPropertyNames()) {
            if (!name.startsWith("cmdstat_")) {
                continue;
            }
            String value = properties.getProperty(name);
            Matcher matcher = CALLS_PATTERN.matcher(value == null ? "" : value);
            CommandStatVo stat = new CommandStatVo();
            stat.setName(name.substring("cmdstat_".length()));
            stat.setValue(matcher.find() ? matcher.group(1) : "0");
            stats.add(stat);
        }
        return stats;
    }

    // ==================== 缓存列表 ====================

    public List<CacheNameVo> getCacheNames() {
        return definitions().stream()
                .map(definition -> new CacheNameVo(definition.cacheName(), definition.remark()))
                .toList();
    }

    public List<String> getCacheKeysByCacheName(String cacheName) {
        CacheDefinition definition = findDefinition(cacheName);
        if (definition == null) {
            return List.of();
        }
        Set<String> keys = redisUtils.scan(definition.prefix() + "*");
        return keys.stream().sorted().toList();
    }

    public CacheContentVo getCacheContent(String cacheName, String cacheKey) {
        CacheDefinition definition = findDefinition(cacheName);
        // key 必须属于该缓存名称的前缀，避免越权查看其它缓存
        if (definition == null || cacheKey == null || !cacheKey.startsWith(definition.prefix())) {
            CacheContentVo invalid = new CacheContentVo();
            invalid.setCacheName(cacheName);
            invalid.setCacheKey(cacheKey);
            invalid.setType("unknown");
            invalid.setCacheValue("(无效的缓存键名)");
            invalid.setTtl(-2);
            return invalid;
        }

        String fullKey = redisUtils.buildKey(cacheKey);
        CacheContentVo vo = redisTemplate.execute((RedisCallback<CacheContentVo>) connection -> {
            CacheContentVo content = new CacheContentVo();
            content.setCacheName(cacheName);
            content.setCacheKey(cacheKey);

            byte[] rawKey = fullKey.getBytes(StandardCharsets.UTF_8);
            DataType dataType = connection.keyCommands().type(rawKey);
            String type = dataType == null ? "none" : dataType.code();
            Long ttl = connection.keyCommands().ttl(rawKey);

            content.setType(type);
            content.setTtl(ttl == null ? -2 : ttl);
            content.setCacheValue(readByType(connection, rawKey, type));
            return content;
        });
        return vo == null ? new CacheContentVo() : vo;
    }

    public void clearCacheName(String cacheName) {
        CacheDefinition definition = findDefinition(cacheName);
        if (definition == null) {
            return;
        }
        redisUtils.scan(definition.prefix() + "*").forEach(redisUtils::delete);
    }

    public void clearCacheKey(String cacheName, String cacheKey) {
        CacheDefinition definition = findDefinition(cacheName);
        if (definition == null || cacheKey == null || !cacheKey.startsWith(definition.prefix())) {
            return;
        }
        redisUtils.delete(cacheKey);
    }

    /**
     * 清理所有业务缓存：按预定义分组逐个前缀删除
     */
    public void clearCacheAll() {
        for (CacheDefinition definition : definitions()) {
            redisUtils.scan(definition.prefix() + "*").forEach(redisUtils::delete);
        }
    }

    // ==================== 内部辅助 ====================

    private String readByType(RedisConnection connection, byte[] rawKey, String type) {
        try {
            switch (type) {
                case "string" -> {
                    byte[] raw = connection.stringCommands().get(rawKey);
                    if (raw == null) {
                        return "";
                    }
                    String value = new String(raw, StandardCharsets.UTF_8).trim();
                    // Java 的 JSON 序列化会给字符串加引号，展示时还原成 Nest 端的纯文本效果
                    if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
                        try {
                            return objectMapper.readValue(value, String.class);
                        } catch (Exception ignored) {
                            return value;
                        }
                    }
                    return value;
                }
                case "list" -> {
                    List<byte[]> rawList = connection.listCommands().lRange(rawKey, 0, -1);
                    List<String> list = new ArrayList<>();
                    if (rawList != null) {
                        rawList.forEach(item -> list.add(new String(item, StandardCharsets.UTF_8)));
                    }
                    return objectMapper.writeValueAsString(list);
                }
                case "hash" -> {
                    Map<byte[], byte[]> rawMap = connection.hashCommands().hGetAll(rawKey);
                    Map<String, String> map = new LinkedHashMap<>();
                    if (rawMap != null) {
                        rawMap.forEach((key, value) -> map.put(
                                new String(key, StandardCharsets.UTF_8),
                                new String(value, StandardCharsets.UTF_8)));
                    }
                    return objectMapper.writeValueAsString(map);
                }
                case "set" -> {
                    Set<byte[]> rawSet = connection.setCommands().sMembers(rawKey);
                    Set<String> set = new LinkedHashSet<>();
                    if (rawSet != null) {
                        rawSet.forEach(item -> set.add(new String(item, StandardCharsets.UTF_8)));
                    }
                    return objectMapper.writeValueAsString(set);
                }
                case "zset" -> {
                    Set<Tuple> tuples = connection.zSetCommands().zRangeWithScores(rawKey, 0, -1);
                    Map<String, Double> map = new LinkedHashMap<>();
                    if (tuples != null) {
                        tuples.forEach(tuple -> map.put(
                                new String(tuple.getValue(), StandardCharsets.UTF_8),
                                tuple.getScore()));
                    }
                    return objectMapper.writeValueAsString(map);
                }
                default -> {
                    return "(unsupported type)";
                }
            }
        } catch (Exception e) {
            return "(读取失败: " + e.getMessage() + ")";
        }
    }

    private CacheDefinition findDefinition(String cacheName) {
        return definitions().stream()
                .filter(definition -> definition.cacheName().equals(cacheName))
                .findFirst()
                .orElse(null);
    }

    /**
     * 业务缓存分组定义，前缀与 RedisUtils 里统一加 java: 前缀后的实际键对应
     */
    private List<CacheDefinition> definitions() {
        return List.of(
                new CacheDefinition("sys_user_info", "user:info:", "用户信息缓存"),
                new CacheDefinition("sys_captcha", "captcha:", "验证码缓存"),
                new CacheDefinition("sys_token_blacklist", "token:blacklist:", "Token 黑名单"),
                new CacheDefinition("sys_dict", "dict:data:", "字典数据缓存"),
                new CacheDefinition("sys_config", "config:", "参数配置缓存"),
                new CacheDefinition("sys_online_user", "online:token:", "在线用户缓存")
        );
    }

    private record CacheDefinition(String cacheName, String prefix, String remark) {
    }
}
