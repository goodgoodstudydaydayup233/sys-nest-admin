package com.sysnest.admin.modules.job.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.job.dto.JobQuery;
import com.sysnest.admin.modules.job.dto.JobRunDto;
import com.sysnest.admin.modules.job.dto.JobSaveDto;
import com.sysnest.admin.modules.job.dto.JobStatusDto;
import com.sysnest.admin.modules.job.service.JobService;
import com.sysnest.admin.modules.job.vo.JobVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 定时任务接口，对应 Nest 的 job.controller.ts
 */
@RestController
@RequestMapping("/job")
@RequiredArgsConstructor
@Tag(name = "定时任务")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "获取定时任务列表")
    @PreAuthorize("@perm.has('monitor:job:list')")
    public Result<PageResult<JobVo>> page(@Valid JobQuery query) {
        return Result.ok(jobService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取定时任务详情")
    @PreAuthorize("@perm.has('monitor:job:query')")
    public Result<JobVo> detail(@PathVariable Integer id) {
        return Result.ok(jobService.detail(id));
    }

    @PostMapping
    @Operation(summary = "创建定时任务")
    @PreAuthorize("@perm.has('monitor:job:add')")
    @OperLog(title = "定时任务", businessType = "1")
    public Result<JobVo> create(@Valid @RequestBody JobSaveDto dto) {
        return Result.ok(jobService.create(dto));
    }

    @PutMapping("/changeStatus")
    @Operation(summary = "修改定时任务状态")
    @PreAuthorize("@perm.has('monitor:job:changeStatus')")
    @OperLog(title = "定时任务", businessType = "2")
    public Result<Void> changeStatus(@Valid @RequestBody JobStatusDto dto) {
        jobService.changeStatus(dto.getJobId(), dto.getStatus());
        return Result.ok();
    }

    @PutMapping("/run")
    @Operation(summary = "立即执行一次定时任务")
    @PreAuthorize("@perm.has('monitor:job:run')")
    @OperLog(title = "定时任务", businessType = "0")
    public Result<Void> run(@Valid @RequestBody JobRunDto dto) {
        jobService.run(dto.getJobId());
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新定时任务")
    @PreAuthorize("@perm.has('monitor:job:edit')")
    @OperLog(title = "定时任务", businessType = "2")
    public Result<JobVo> update(@PathVariable Integer id, @Valid @RequestBody JobSaveDto dto) {
        return Result.ok(jobService.update(id, dto));
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除定时任务")
    @PreAuthorize("@perm.has('monitor:job:remove')")
    @OperLog(title = "定时任务", businessType = "3")
    public Result<Void> batchRemove(@Valid @RequestBody IdsDto dto) {
        jobService.batchRemove(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除定时任务")
    @PreAuthorize("@perm.has('monitor:job:remove')")
    @OperLog(title = "定时任务", businessType = "3")
    public Result<Void> remove(@PathVariable Integer id) {
        jobService.remove(id);
        return Result.ok();
    }
}
