package com.sysnest.admin.modules.notice.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.notice.dto.NoticeQuery;
import com.sysnest.admin.modules.notice.dto.NoticeSaveDto;
import com.sysnest.admin.modules.notice.service.NoticeService;
import com.sysnest.admin.modules.notice.vo.NoticeVo;
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
 * 通知公告接口，对应 Nest 的 notice.controller.ts
 */
@RestController
@RequestMapping("/system/notice")
@RequiredArgsConstructor
@Tag(name = "通知公告")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    @Operation(summary = "获取通知公告列表")
    @PreAuthorize("@perm.has('system:notice:list')")
    public Result<PageResult<NoticeVo>> page(@Valid NoticeQuery query) {
        return Result.ok(noticeService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取通知公告详情")
    @PreAuthorize("@perm.has('system:notice:query')")
    public Result<NoticeVo> detail(@PathVariable Integer id) {
        return Result.ok(noticeService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增通知公告")
    @PreAuthorize("@perm.has('system:notice:add')")
    @OperLog(title = "通知公告", businessType = "1")
    public Result<NoticeVo> create(@Valid @RequestBody NoticeSaveDto dto) {
        return Result.ok(noticeService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改通知公告")
    @PreAuthorize("@perm.has('system:notice:edit')")
    @OperLog(title = "通知公告", businessType = "2")
    public Result<NoticeVo> update(@PathVariable Integer id, @Valid @RequestBody NoticeSaveDto dto) {
        return Result.ok(noticeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除通知公告")
    @PreAuthorize("@perm.has('system:notice:remove')")
    @OperLog(title = "通知公告", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        noticeService.delete(id);
        return Result.ok();
    }
}
