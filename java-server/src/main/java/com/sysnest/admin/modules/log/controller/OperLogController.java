package com.sysnest.admin.modules.log.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.log.dto.OperLogQuery;
import com.sysnest.admin.modules.log.service.OperLogService;
import com.sysnest.admin.modules.log.vo.OperLogVo;
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
 * 操作日志接口，对应 Nest 的 log.controller.ts
 */
@RestController
@RequestMapping("/oper-log")
@RequiredArgsConstructor
@Tag(name = "操作日志")
public class OperLogController {

    private final OperLogService operLogService;

    @GetMapping
    @Operation(summary = "获取操作日志列表")
    @PreAuthorize("@perm.has('monitor:operlog:list')")
    public Result<PageResult<OperLogVo>> page(@Valid OperLogQuery query) {
        return Result.ok(operLogService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取操作日志详情")
    @PreAuthorize("@perm.has('monitor:operlog:query')")
    public Result<OperLogVo> detail(@PathVariable Integer id) {
        return Result.ok(operLogService.detail(id));
    }

    @DeleteMapping("/clean")
    @Operation(summary = "清空所有操作日志")
    @PreAuthorize("@perm.has('monitor:operlog:remove')")
    @OperLog(title = "操作日志", businessType = "9")
    public Result<Void> clean() {
        operLogService.cleanAll();
        return Result.ok();
    }

    @DeleteMapping
    @Operation(summary = "批量删除操作日志")
    @PreAuthorize("@perm.has('monitor:operlog:remove')")
    @OperLog(title = "操作日志", businessType = "3")
    public Result<Void> batchRemove(@Valid @RequestBody IdsDto dto) {
        operLogService.remove(dto.getIds());
        return Result.ok();
    }
}
