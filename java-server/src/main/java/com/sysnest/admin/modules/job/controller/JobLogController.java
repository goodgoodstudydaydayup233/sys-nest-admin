package com.sysnest.admin.modules.job.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.job.dto.JobLogQuery;
import com.sysnest.admin.modules.job.service.JobLogService;
import com.sysnest.admin.modules.job.vo.JobLogVo;
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
 * 定时任务调度日志接口，对应 Nest 的 job-log.controller.ts
 */
@RestController
@RequestMapping("/job-log")
@RequiredArgsConstructor
@Tag(name = "调度日志")
public class JobLogController {

    private final JobLogService jobLogService;

    @GetMapping
    @Operation(summary = "获取调度日志列表")
    @PreAuthorize("@perm.has('monitor:jobLog:list')")
    public Result<PageResult<JobLogVo>> page(@Valid JobLogQuery query) {
        return Result.ok(jobLogService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取调度日志详情")
    @PreAuthorize("@perm.has('monitor:jobLog:list')")
    public Result<JobLogVo> detail(@PathVariable Integer id) {
        return Result.ok(jobLogService.detail(id));
    }

    @DeleteMapping("/clean")
    @Operation(summary = "清空所有调度日志")
    @PreAuthorize("@perm.has('monitor:jobLog:remove')")
    @OperLog(title = "调度日志", businessType = "9")
    public Result<Void> clean() {
        jobLogService.cleanAll();
        return Result.ok();
    }

    @DeleteMapping
    @Operation(summary = "批量删除调度日志")
    @PreAuthorize("@perm.has('monitor:jobLog:remove')")
    @OperLog(title = "调度日志", businessType = "3")
    public Result<Void> batchRemove(@Valid @RequestBody IdsDto dto) {
        jobLogService.remove(dto.getIds());
        return Result.ok();
    }
}
