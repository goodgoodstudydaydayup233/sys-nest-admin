package com.sysnest.admin.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * 登录用户信息，实现 Spring Security 的 UserDetails
 * 相当于 Nest 的 req.userInfo
 */
@Getter
@AllArgsConstructor
public class LoginUser implements UserDetails {

    private final Integer userId;
    private final String username;
    /** 权限点集合，如 system:user:list */
    private final Set<String> permissions;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (permissions == null) {
            return List.of();
        }
        return permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    /** JWT 认证不需要密码，这里返回空串 */
    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
