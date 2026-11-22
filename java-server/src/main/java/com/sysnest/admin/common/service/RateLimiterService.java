package com.sysnest.admin.common.service;

import com.sysnest.admin.common.util.RedisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 限流计数器，相当于 Nest 的 rate-limiter.service.ts
 *
 * 用 Lua 脚本把“自增 + 首次设置过期 + 判断是否超限”合并成一次原子操作，
 * 并发请求下也不会多算或漏算。
 */
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    /**
     * KEYS[1] = 限流 key
     * ARGV[1] = 时间窗口内最大次数
     * ARGV[2] = 时间窗口（秒）
     * 返回：{ 是否放行(1/0), 当前计数, 剩余秒数 }
     */
    private static final byte[] LUA_SCRIPT = """
            local key = KEYS[1]
            local limit = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])

            local current = redis.call('INCR', key)
            if current == 1 then
              redis.call('EXPIRE', key, window)
              return {1, current, window}
            end

            local ttl = redis.call('TTL', key)
            if current > limit then
              return {0, current, ttl}
            end
            return {1, current, ttl}
            """.getBytes(StandardCharsets.UTF_8);

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisUtils redisUtils;

    /**
     * 检查某个限流键是否还能放行
     *
     * @param key           业务限流键，如 rate_limit:ip:127.0.0.1
     * @param limit         时间窗口内最大请求次数
     * @param windowSeconds 时间窗口（秒）
     */
    public CheckResult check(String key, long limit, long windowSeconds) {
        String fullKey = redisUtils.buildKey(key);

        List<Object> result = stringRedisTemplate.execute((RedisCallback<List<Object>>) connection ->
                connection.scriptingCommands().eval(LUA_SCRIPT, ReturnType.MULTI, 1,
                        toBytes(fullKey),
                        toBytes(String.valueOf(limit)),
                        toBytes(String.valueOf(windowSeconds))));

        if (result == null || result.size() < 3) {
            // 脚本返回异常时保守放行，避免 Redis 抖动导致整个站点不可用
            return new CheckResult(true, 0, limit, 0);
        }

        return new CheckResult(
                toLong(result.get(0)) == 1,
                toLong(result.get(1)),
                limit,
                toLong(result.get(2)));
    }

    /**
     * 手动清除计数，便于测试或提前解除限流
     */
    public void reset(String key) {
        stringRedisTemplate.delete(redisUtils.buildKey(key));
    }

    private static byte[] toBytes(String value) {
        return value.getBytes(StandardCharsets.UTF_8);
    }

    private static long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    /**
     * 单次限流检查结果
     */
    public record CheckResult(boolean allowed, long count, long limit, long ttl) {
    }
}
