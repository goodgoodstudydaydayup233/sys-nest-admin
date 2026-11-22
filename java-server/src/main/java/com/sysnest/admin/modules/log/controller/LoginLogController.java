package com.sysnest.admin.modules.log.controller;

import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.log.dto.LoginLogQuery;
import com.sysnest.admin.modules.log.service.LoginLogService;
import com.sysnest.admin.modules.log.vo.LoginLogVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录日志接口，对应 Nest 的 login-log.controller.ts
 */
@RestController
@RequestMapping("/logininfor")
@RequiredArgsConstructor
@Tag(name = "登录日志")
public class LoginLogController {

    private final LoginLogService loginLogService;

    @GetMapping
    @Operation(summary = "获取登录日志列表")
    @PreAuthorize("@perm.has('monitor:logininfor:list')")
    public Result<PageResult<LoginLogVo>> page(@Valid LoginLogQuery query) {
        return Result.ok(loginLogService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取登录日志详情")
    @PreAuthorize("@perm.has('monitor:logininfor:list')")
    public Result<LoginLogVo> detail(@PathVariable Integer id) {
        return Result.ok(loginLogService.detail(id));
    }

    @DeleteMapping("/clean")
    @Operation(summary = "清空所有登录日志")
    @PreAuthorize("@perm.has('monitor:logininfor:remove')")
    public Result<Void> clean() {
        loginLogService.cleanAll();
        return Result.ok();
    }

    @DeleteMapping
    @Operation(summary = "批量删除登录日志")
    @PreAuthorize("@perm.has('monitor:logininfor:remove')")
    public Result<Void> batchRemove(@Valid @RequestBody IdsDto dto) {
        loginLogService.remove(dto.getIds());
        return Result.ok();
    }
}
