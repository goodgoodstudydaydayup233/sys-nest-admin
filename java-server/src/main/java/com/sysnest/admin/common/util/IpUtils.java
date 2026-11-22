package com.sysnest.admin.common.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * 获取客户端真实 IP 的小工具
 * 反向代理场景优先读 X-Forwarded-For / X-Real-IP，与 Nest 端保持一致
 */
public final class IpUtils {

    private IpUtils() {
    }

    public static String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded) && !"unknown".equalsIgnoreCase(forwarded)) {
            // 可能是 "客户端IP, 代理1, 代理2"，第一个才是真实客户端
            return forwarded.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp) && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp;
        }

        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr : "unknown";
    }
}
