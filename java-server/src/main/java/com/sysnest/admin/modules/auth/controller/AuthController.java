package com.sysnest.admin.modules.auth.controller;

import com.sysnest.admin.common.annotation.RateLimit;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.auth.dto.LoginDto;
import com.sysnest.admin.modules.auth.dto.RefreshTokenDto;
import com.sysnest.admin.modules.auth.service.AuthService;
import com.sysnest.admin.modules.auth.vo.LoginVo;
import com.sysnest.admin.modules.auth.vo.UserInfoVo;
import com.sysnest.admin.modules.menu.vo.RouterVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 认证接口，对应 Nest 的 auth.controller.ts
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "认证")
public class AuthController {

    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;

    /**
     * 登录：60 秒内同一 IP 最多 10 次
     */
    @PostMapping("/login")
    @Operation(summary = "登录")
    @RateLimit(time = 60, count = 10, dimension = RateLimit.Dimension.IP)
    public Result<LoginVo> login(@Valid @RequestBody LoginDto dto, HttpServletRequest request) {
        return Result.ok(authService.login(dto, request));
    }

    /**
     * 当前用户信息
     */
    @GetMapping("/userInfo")
    @Operation(summary = "获取当前用户信息")
    public Result<UserInfoVo> userInfo() {
        return Result.ok(authService.getUserInfo());
    }

    /**
     * 刷新 Token：60 秒内同一 IP 最多 10 次
     */
    @PostMapping("/refresh")
    @Operation(summary = "刷新 Token")
    @RateLimit(time = 60, count = 10, dimension = RateLimit.Dimension.IP)
    public Result<LoginVo> refresh(@Valid @RequestBody RefreshTokenDto dto) {
        return Result.ok(authService.refresh(dto));
    }

    /**
     * 登出：把当前 Access Token 加入黑名单
     * 与 Nest 端一致：登出属于登录日志范畴，不记录操作日志
     */
    @PostMapping("/logout")
    @Operation(summary = "退出登录")
    public Result<Void> logout(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = header != null && header.startsWith(BEARER_PREFIX)
                ? header.substring(BEARER_PREFIX.length())
                : null;
        authService.logout(token);
        return Result.ok();
    }

    /**
     * 动态路由
     */
    @GetMapping("/getRouters")
    @Operation(summary = "获取动态路由")
    public Result<List<RouterVo>> getRouters() {
        return Result.ok(authService.getRouters());
    }
}
