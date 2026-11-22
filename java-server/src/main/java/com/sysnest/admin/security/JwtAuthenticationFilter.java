package com.sysnest.admin.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 过滤器，相当于 Nest 的 jwt-auth.guard.ts
 * 有合法 Token 就把用户放进安全上下文；没有则放行，由安全配置决定是否 401
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 请求属性名：访问日志在 SecurityContext 清理后仍能拿到当前用户名 */
    public static final String AUTH_USERNAME_ATTRIBUTE = "AUTH_USERNAME";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                // 已登出/被强制下线的 Token 不再放行
                if (tokenBlacklistService.isBlacklisted(token)) {
                    SecurityContextHolder.clearContext();
                } else {
                    LoginUser loginUser = jwtTokenProvider.parseAccessToken(token);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(loginUser, null, loginUser.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    // 供 AccessLogFilter 在安全上下文清理后记录操作人
                    request.setAttribute(AUTH_USERNAME_ATTRIBUTE, loginUser.getUsername());
                }
            } catch (Exception e) {
                // Token 无效/过期：清空上下文，后续由安全链返回 401
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
