package com.sysnest.admin.security;

import com.sysnest.admin.config.properties.AppProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 权限点校验单元测试：对应 Nest 的 permission.guard.ts 行为
 */
class PermissionCheckerTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void superAdminAlwaysPasses() {
        loginAs("admin", Set.of());
        PermissionChecker checker = new PermissionChecker(appProperties("admin"));

        assertTrue(checker.has("system:user:list"));
        assertTrue(checker.has("any:unknown:perm"));
    }

    @Test
    void wildcardPermissionPasses() {
        loginAs("normal", Set.of("*:*:*"));
        PermissionChecker checker = new PermissionChecker(appProperties("admin"));

        assertTrue(checker.has("system:user:list"));
    }

    @Test
    void exactPermissionPasses() {
        loginAs("normal", Set.of("system:user:list"));
        PermissionChecker checker = new PermissionChecker(appProperties("admin"));

        assertTrue(checker.has("system:user:list"));
        assertFalse(checker.has("system:user:delete"));
    }

    @Test
    void anonymousDenied() {
        PermissionChecker checker = new PermissionChecker(appProperties("admin"));

        assertFalse(checker.has("system:user:list"));
    }

    private AppProperties appProperties(String admin) {
        AppProperties properties = new AppProperties();
        properties.setAdmin(admin);
        return properties;
    }

    private void loginAs(String username, Set<String> permissions) {
        LoginUser user = new LoginUser(1, username, permissions);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }
}
