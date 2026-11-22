package com.sysnest.admin.security;

import com.sysnest.admin.common.util.RedisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * Token 黑名单，相当于 Nest 端登出/强制下线时往 Redis 写 token:blacklist:xxx 的逻辑
 *
 * 登出或强制下线时调用 blacklist(token)，之后该 Token 再访问接口会被过滤器拦下并返回 401。
 * 黑名单的过期时间就是 Token 自己的剩余有效期，过期后自动从 Redis 消失，不会无限堆积。
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    /** 业务键前缀，实际键为 java:token:blacklist:<token> */
    private static final String KEY_PREFIX = "token:blacklist:";

    private final RedisUtils redisUtils;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 把 Token 加入黑名单；无效或已过期的 Token 无需处理
     */
    public void blacklist(String token) {
        if (!StringUtils.hasText(token)) {
            return;
        }
        Duration remaining = jwtTokenProvider.getRemainingValidity(token);
        if (remaining.isZero() || remaining.isNegative()) {
            return;
        }
        // 值存一个占位时间戳，主要靠键是否存在来判断
        redisUtils.set(KEY_PREFIX + token, System.currentTimeMillis(), remaining);
    }

    /**
     * 判断 Token 是否已被拉黑
     */
    public boolean isBlacklisted(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }
        return redisUtils.get(KEY_PREFIX + token) != null;
    }
}
