package com.sysnest.admin.security;

import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.config.properties.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * 权限点校验器，相当于 Nest 的 permission.guard.ts
 * 用法：@PreAuthorize("@perm.has('system:user:list')")
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionChecker {

    private final AppProperties appProperties;

    public boolean has(String permission) {
        LoginUser loginUser;
        try {
            loginUser = SecurityUtils.currentUser();
        } catch (BusinessException e) {
            return false;
        }

        // 超级管理员直接放行
        if (appProperties.getAdmin().equals(loginUser.getUsername())) {
            return true;
        }

        Set<String> permissions = loginUser.getPermissions();
        if (permissions == null) {
            return false;
        }
        // 通配符权限直接放行，否则必须精确命中
        return permissions.contains("*:*:*") || permissions.contains(permission);
    }
}
