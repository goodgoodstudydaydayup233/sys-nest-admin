package com.sysnest.admin.common.logging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sysnest.admin.common.util.IpUtils;
import com.sysnest.admin.security.JwtAuthenticationFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 访问日志过滤器：记录方法、路径、状态码、耗时、IP、操作人、UA
 * 对应 Nest 的 access-log.middleware.ts，写入 logs/access
 *
 * 日志内容以 JSON 写在 logback 的 %msg 部分，文件日志查询接口会解析出结构化字段。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class AccessLogFilter extends OncePerRequestFilter {

    private static final Logger ACCESS_LOG = LoggerFactory.getLogger("ACCESS");

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long cost = System.currentTimeMillis() - start;
            String url = request.getRequestURI();
            int status = response.getStatus();
            String username = String.valueOf(request.getAttribute(JwtAuthenticationFilter.AUTH_USERNAME_ATTRIBUTE));
            if ("null".equals(username)) {
                username = "";
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("method", request.getMethod());
            entry.put("url", url);
            entry.put("status", status);
            entry.put("ip", IpUtils.getClientIp(request));
            entry.put("user", username);
            entry.put("cost", cost);
            entry.put("ua", truncate(request.getHeader("User-Agent"), 200));
            entry.put("message", request.getMethod() + " " + url + " " + status);

            try {
                ACCESS_LOG.info(objectMapper.writeValueAsString(entry));
            } catch (Exception e) {
                ACCESS_LOG.info("{} {} status={} cost={}ms ip={}",
                        request.getMethod(), url, status, cost, IpUtils.getClientIp(request));
            }
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
