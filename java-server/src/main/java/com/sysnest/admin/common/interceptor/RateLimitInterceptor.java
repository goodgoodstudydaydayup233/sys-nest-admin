package com.sysnest.admin.common.interceptor;

import com.sysnest.admin.common.annotation.RateLimit;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.service.RateLimiterService;
import com.sysnest.admin.common.util.IpUtils;
import com.sysnest.admin.config.properties.AppProperties;
import com.sysnest.admin.security.LoginUser;
import com.sysnest.admin.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 限流拦截器，相当于 Nest 的 rate-limit.interceptor.ts
 *
 * 固定先检查两层：
 * 1. 全局：所有请求共用一个计数，保护服务器整体 QPS
 * 2. IP：单个 IP 对全部接口的总请求数
 *
 * 第三层由方法上的 @RateLimit 决定：
 * - 没标注：已登录按“用户 + 接口”，未登录按“IP + 接口”
 * - 标注 IP：按 IP
 * - 标注 USER：按“用户 + 接口”，未登录降级为“IP + 接口”
 * - 标注 DEFAULT：按“IP + 接口”
 */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final String GLOBAL_KEY = "rate_limit:global";

    private final AppProperties appProperties;
    private final RateLimiterService rateLimiterService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        AppProperties.RateLimit config = appProperties.getRateLimit();
        if (!config.isEnabled()) {
            return true;
        }

        String ip = IpUtils.getClientIp(request);
        String method = request.getMethod();
        // getServletPath 不含 /dev-api 前缀，与 Nest 的 request.path 语义一致
        String path = request.getServletPath();

        // 第一层：全局总请求数
        AppProperties.RateLimit.Rule global = config.getGlobal();
        if (!check(GLOBAL_KEY, global.getCount(), global.getTime())) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "当前访问量过大，请稍候再试（" + global.getTime() + "秒内最多请求" + global.getCount() + "次）");
        }

        // 第二层：单 IP 全局限流
        AppProperties.RateLimit.Rule ipRule = config.getIp();
        if (!check("rate_limit:ip:" + ip, ipRule.getCount(), ipRule.getTime())) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "请求过于频繁，请稍候再试（" + ipRule.getTime() + "秒内最多请求" + ipRule.getCount() + "次）");
        }

        // 第三层：方法注解优先，没有注解则用默认规则
        RateLimit annotation = findAnnotation(handler);
        long time;
        long count;
        String dimensionKey;

        if (annotation == null) {
            AppProperties.RateLimit.Rule rule = config.getDefaultRule();
            time = rule.getTime();
            count = rule.getCount();
            dimensionKey = defaultDimensionKey(request, ip, method, path);
        } else {
            time = annotation.time();
            count = annotation.count();
            dimensionKey = switch (annotation.dimension()) {
                case IP -> "rate_limit:ip_custom:" + ip;
                case USER -> userKeyOrFallback(ip, method, path);
                case DEFAULT -> "rate_limit:default:" + ip + ":" + method + ":" + path;
            };
        }

        if (!check(dimensionKey, count, time)) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "请求过于频繁，请稍候再试（" + time + "秒内最多请求" + count + "次）");
        }

        return true;
    }

    /**
     * 没写注解时的默认维度：登录用户按用户算，未登录按 IP 算
     */
    private String defaultDimensionKey(HttpServletRequest request, String ip, String method, String path) {
        return userKeyOrFallback(ip, method, path);
    }

    private String userKeyOrFallback(String ip, String method, String path) {
        LoginUser loginUser = SecurityUtils.currentUserOrNull();
        if (loginUser != null) {
            return "rate_limit:user:" + loginUser.getUserId() + ":" + method + ":" + path;
        }
        return "rate_limit:default:" + ip + ":" + method + ":" + path;
    }

    private RateLimit findAnnotation(Object handler) {
        if (handler instanceof HandlerMethod handlerMethod) {
            return handlerMethod.getMethodAnnotation(RateLimit.class);
        }
        return null;
    }

    private boolean check(String key, long count, long time) {
        return rateLimiterService.check(key, count, time).allowed();
    }
}
