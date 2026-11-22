package com.sysnest.admin.modules.online.service;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.IpUtils;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.common.util.UaUtils;
import com.sysnest.admin.modules.online.dto.OnlineQuery;
import com.sysnest.admin.modules.online.entity.OnlineUser;
import com.sysnest.admin.modules.user.entity.User;
import com.sysnest.admin.security.JwtTokenProvider;
import com.sysnest.admin.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * 在线用户服务：登录/刷新时写入，登出/强退时删除
 * 相当于 Nest 端往 online:token:{token} 写记录的逻辑
 */
@Service
@RequiredArgsConstructor
public class OnlineUserService {

    private static final String PREFIX = "online:token:";

    private final RedisUtils redisUtils;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    /**
     * 记录在线用户，TTL 取 Access Token 剩余有效期
     */
    public void save(String accessToken, User user, HttpServletRequest request) {
        Duration ttl = jwtTokenProvider.getRemainingValidity(accessToken);
        if (ttl.isZero() || ttl.isNegative()) {
            return;
        }

        String userAgent = request == null ? null : request.getHeader("User-Agent");
        OnlineUser onlineUser = new OnlineUser(
                accessToken,
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                request == null ? "unknown" : IpUtils.getClientIp(request),
                UaUtils.parseBrowser(userAgent),
                UaUtils.parseOs(userAgent),
                LocalDateTime.now().toString());

        redisUtils.set(PREFIX + accessToken, onlineUser, ttl);
    }

    public void remove(String accessToken) {
        if (accessToken != null) {
            redisUtils.delete(PREFIX + accessToken);
        }
    }

    /**
     * 查询在线用户列表：支持用户名 / IP 模糊筛选，按登录时间倒序
     */
    public List<OnlineUser> list(OnlineQuery query) {
        Set<String> keys = redisUtils.scan(PREFIX + "*");
        List<OnlineUser> list = new ArrayList<>();
        for (String key : keys) {
            OnlineUser onlineUser = redisUtils.get(key);
            if (onlineUser == null) {
                continue;
            }
            if (!StringUtils.hasText(onlineUser.getTokenId())) {
                onlineUser.setTokenId(key.substring(PREFIX.length()));
            }
            if (query != null && StringUtils.hasText(query.getUsername())
                    && (onlineUser.getUsername() == null
                    || !onlineUser.getUsername().toLowerCase().contains(query.getUsername().toLowerCase()))) {
                continue;
            }
            if (query != null && StringUtils.hasText(query.getIpaddr())
                    && (onlineUser.getIpaddr() == null
                    || !onlineUser.getIpaddr().toLowerCase().contains(query.getIpaddr().toLowerCase()))) {
                continue;
            }
            list.add(onlineUser);
        }
        // 登录时间是最新的 ISO 字符串，倒序即“最新登录在前”
        list.sort(Comparator.comparing(OnlineUser::getLoginTime,
                Comparator.nullsLast(Comparator.<String>reverseOrder())));
        return list;
    }

    /**
     * 强退指定 token：加入黑名单 + 删除在线记录
     */
    public void forceLogoutByToken(String tokenId) {
        OnlineUser onlineUser = redisUtils.get(PREFIX + tokenId);
        if (onlineUser == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "该用户已下线");
        }
        tokenBlacklistService.blacklist(tokenId);
        redisUtils.delete(PREFIX + tokenId);
    }

    /**
     * 强制某个用户的所有会话下线：Token 拉黑 + 删除在线记录
     * 用于禁用用户、删除用户、批量删除等场景
     */
    public void forceLogout(Integer userId) {
        Set<String> keys = redisUtils.scan(PREFIX + "*");
        for (String key : keys) {
            OnlineUser onlineUser = redisUtils.get(key);
            if (onlineUser != null && userId.equals(onlineUser.getUserId())) {
                tokenBlacklistService.blacklist(onlineUser.getTokenId());
                redisUtils.delete(key);
            }
        }
    }
}
