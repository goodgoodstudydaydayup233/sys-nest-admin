package com.sysnest.admin.modules.auth.service;

import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.auth.vo.UserInfoVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 用户权限缓存，相当于 Nest 的 auth-cache.service.ts
 * 缓存整个 UserInfo，减少每次请求都查用户、角色、菜单三张表
 */
@Service
@RequiredArgsConstructor
public class AuthCacheService {

    /** 业务键：user:info:{userId}，实际键带 java: 前缀 */
    private static final String PREFIX = "user:info:";
    private static final Duration TTL = Duration.ofSeconds(86400);

    private final RedisUtils redisUtils;

    public UserInfoVo get(Integer userId) {
        return redisUtils.get(PREFIX + userId);
    }

    public void put(UserInfoVo userInfo) {
        redisUtils.set(PREFIX + userInfo.getId(), userInfo, TTL);
    }

    public void evict(Integer userId) {
        redisUtils.delete(PREFIX + userId);
    }

    /**
     * 用户资料变化后同步缓存里的昵称/头像；缓存不存在则不处理
     */
    public void syncProfile(Integer userId, String nickname, String avatar) {
        UserInfoVo cached = get(userId);
        if (cached == null) {
            return;
        }
        cached.setNickname(nickname);
        cached.setAvatar(avatar);
        put(cached);
    }

    /**
     * 角色/菜单变更后清空所有用户缓存
     */
    public void evictAll() {
        redisUtils.scan(PREFIX + "*").forEach(redisUtils::delete);
    }
}
