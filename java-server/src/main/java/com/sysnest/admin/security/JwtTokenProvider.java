package com.sysnest.admin.security;

import com.sysnest.admin.config.properties.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * JWT 生成与解析，相当于 Nest 的 auth.service 签发 Token + jwt.strategy.ts 校验 Token
 * Access Token 用于访问，Refresh Token 用于续期，两者使用不同密钥
 */
@Component
public class JwtTokenProvider {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final Duration accessTokenExpire;
    private final Duration refreshTokenExpire;

    public JwtTokenProvider(AppProperties appProperties) {
        AppProperties.Jwt jwt = appProperties.getJwt();
        this.accessKey = Keys.hmacShaKeyFor(jwt.getSecret().getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(jwt.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpire = jwt.getAccessTokenExpire();
        this.refreshTokenExpire = jwt.getRefreshTokenExpire();
    }

    public String generateAccessToken(LoginUser user) {
        return buildToken(user, accessKey, accessTokenExpire);
    }

    public String generateRefreshToken(LoginUser user) {
        return buildToken(user, refreshKey, refreshTokenExpire);
    }

    /**
     * 解析访问 Token，签名不对或过期会抛异常，由过滤器捕获后按未登录处理
     */
    public LoginUser parseAccessToken(String token) {
        return toLoginUser(parseClaims(token, accessKey));
    }

    /**
     * 解析刷新 Token，供刷新接口使用
     */
    public LoginUser parseRefreshToken(String token) {
        return toLoginUser(parseClaims(token, refreshKey));
    }

    /**
     * 计算访问 Token 的剩余有效期，用于设置黑名单过期时间
     * 无效或已过期时返回 0，调用方无需处理异常
     */
    public Duration getRemainingValidity(String token) {
        try {
            Date expiration = parseClaims(token, accessKey).getExpiration();
            long remainMillis = expiration.getTime() - System.currentTimeMillis();
            return remainMillis <= 0 ? Duration.ZERO : Duration.ofMillis(remainMillis);
        } catch (Exception e) {
            return Duration.ZERO;
        }
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessTokenExpire.toSeconds();
    }

    private String buildToken(LoginUser user, SecretKey key, Duration expire) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expire.toMillis());
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getUserId())
                .claim("permissions", user.getPermissions())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    private Claims parseClaims(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @SuppressWarnings("unchecked")
    private LoginUser toLoginUser(Claims claims) {
        Number userId = claims.get("userId", Number.class);
        List<?> rawPermissions = claims.get("permissions", List.class);
        Set<String> permissions = rawPermissions == null
                ? Set.of()
                : rawPermissions.stream().map(String::valueOf).collect(Collectors.toSet());
        return new LoginUser(userId == null ? null : userId.intValue(), claims.getSubject(), permissions);
    }
}
