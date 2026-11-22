package com.sysnest.admin.security;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 取当前登录用户的工具类，相当于 Nest 的 @User() 装饰器
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * 取当前登录用户，没有登录态时抛 401
     */
    public static LoginUser currentUser() {
        LoginUser loginUser = currentUserOrNull();
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return loginUser;
    }

    /**
     * 取当前登录用户，没有登录态时返回 null（用于可选登录的场景，如限流）
     */
    public static LoginUser currentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser loginUser) {
            return loginUser;
        }
        return null;
    }

    public static Integer currentUserId() {
        return currentUser().getUserId();
    }

    public static String currentUsername() {
        return currentUser().getUsername();
    }

    /**
     * 取当前用户名，没有登录态（如定时任务）时返回兜底值
     */
    public static String currentUsernameOrDefault(String fallback) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser loginUser) {
            return loginUser.getUsername();
        }
        return fallback;
    }
}
