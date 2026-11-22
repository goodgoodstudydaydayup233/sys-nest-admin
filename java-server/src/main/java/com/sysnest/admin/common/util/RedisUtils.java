package com.sysnest.admin.common.util;

import com.sysnest.admin.config.properties.AppProperties;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis 通用缓存工具，相当于 Nest 的 core/redis/redis.service.ts
 *
 * 所有方法只接收“业务 key”，统一前缀由本类自动拼接：
 *   业务 key: captcha:abc123
 *   实际键:   java:captcha:abc123（前缀来自 app.redis.key-prefix）
 */
@Component
public class RedisUtils {

    private final RedisTemplate<String, Object> redisTemplate;
    private final String keyPrefix;

    public RedisUtils(RedisTemplate<String, Object> redisTemplate, AppProperties appProperties) {
        this.redisTemplate = redisTemplate;
        String prefix = appProperties.getRedis().getKeyPrefix();
        if (prefix == null) {
            prefix = "";
        }
        // 统一补分隔符，避免配置成 "java" 时拼出 "javacaptcha:xxx"
        if (!prefix.isEmpty() && !prefix.endsWith(":")) {
            prefix = prefix + ":";
        }
        this.keyPrefix = prefix;
    }

    /**
     * 读取缓存，泛型由调用方决定
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) redisTemplate.opsForValue().get(buildKey(key));
    }

    /**
     * 写入缓存，不设置过期时间
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(buildKey(key), value);
    }

    /**
     * 写入缓存并设置过期时间
     */
    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(buildKey(key), value, ttl);
    }

    /**
     * 删除缓存
     *
     * @return true 表示确实删掉了一条
     */
    public boolean delete(String key) {
        return Boolean.TRUE.equals(redisTemplate.delete(buildKey(key)));
    }

    /**
     * 原子自增，首次创建时设置过期时间（用于登录失败计数等）
     */
    public long increment(String key, long delta, Duration ttlIfNew) {
        String fullKey = buildKey(key);
        Long value = redisTemplate.opsForValue().increment(fullKey, delta);
        if (value != null && value == delta) {
            redisTemplate.expire(fullKey, ttlIfNew);
        }
        return value == null ? 0 : value;
    }

    /**
     * 查看剩余有效期（秒）
     *
     * @return -1 表示永久，-2 表示键不存在
     */
    public long getExpire(String key) {
        Long expire = redisTemplate.getExpire(buildKey(key), TimeUnit.SECONDS);
        return expire == null ? -2 : expire;
    }

    /**
     * 按模式扫描键，返回“去掉统一前缀”的业务 key
     * 使用游标分批遍历，不用 KEYS *，避免阻塞 Redis
     *
     * @param pattern 业务键模式，如 captcha:*
     */
    public Set<String> scan(String pattern) {
        String actualPattern = buildKey(pattern == null || pattern.isBlank() ? "*" : pattern);
        ScanOptions options = ScanOptions.scanOptions().match(actualPattern).count(1000).build();

        Set<String> keys = new LinkedHashSet<>();
        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            cursor.forEachRemaining(key -> keys.add(stripPrefix(key)));
        }
        return keys;
    }

    /**
     * 拼上统一前缀；已经是完整键时不重复拼接
     */
    public String buildKey(String key) {
        if (keyPrefix.isEmpty() || key.startsWith(keyPrefix)) {
            return key;
        }
        return keyPrefix + key;
    }

    private String stripPrefix(String key) {
        if (keyPrefix.isEmpty() || !key.startsWith(keyPrefix)) {
            return key;
        }
        return key.substring(keyPrefix.length());
    }
}
