package com.sysnest.admin.common.util;

import org.springframework.util.StringUtils;

/**
 * User-Agent 解析工具，用于登录日志和在线用户
 * 只识别常见浏览器/系统，识别不出统一返回 Unknown，和 Nest 端保持一致
 */
public final class UaUtils {

    private UaUtils() {
    }

    public static String parseBrowser(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return "Unknown";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("edg/")) {
            return "Edge";
        }
        if (ua.contains("chrome") && !ua.contains("chromium")) {
            return "Chrome";
        }
        if (ua.contains("firefox")) {
            return "Firefox";
        }
        if (ua.contains("safari") && !ua.contains("chrome")) {
            return "Safari";
        }
        if (ua.contains("msie") || ua.contains("trident")) {
            return "IE";
        }
        if (ua.contains("opera") || ua.contains("opr/")) {
            return "Opera";
        }
        return "Unknown";
    }

    public static String parseOs(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return "Unknown";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("windows nt 10.0")) {
            return "Windows 10/11";
        }
        if (ua.contains("windows nt 6.3")) {
            return "Windows 8.1";
        }
        if (ua.contains("windows nt 6.1")) {
            return "Windows 7";
        }
        if (ua.contains("windows")) {
            return "Windows";
        }
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            return "iOS";
        }
        if (ua.contains("mac os x") || ua.contains("macintosh")) {
            return "macOS";
        }
        if (ua.contains("android")) {
            return "Android";
        }
        if (ua.contains("linux")) {
            return "Linux";
        }
        return "Unknown";
    }
}
