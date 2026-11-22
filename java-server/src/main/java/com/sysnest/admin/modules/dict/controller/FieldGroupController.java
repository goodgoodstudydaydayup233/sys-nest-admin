package com.sysnest.admin.modules.dict.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.dict.dto.FieldGroupQuery;
import com.sysnest.admin.modules.dict.dto.FieldGroupSaveDto;
import com.sysnest.admin.modules.dict.service.FieldGroupService;
import com.sysnest.admin.modules.dict.vo.FieldGroupVo;
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

import java.util.List;

/**
 * 字段分组接口
 */
@RestController
@RequestMapping("/field-group")
@RequiredArgsConstructor
@Tag(name = "字段分组")
public class FieldGroupController {

    private final FieldGroupService fieldGroupService;

    @GetMapping
    @Operation(summary = "获取字段分组列表")
    @PreAuthorize("@perm.has('system:fieldGroup:list')")
    public Result<PageResult<FieldGroupVo>> page(@Valid FieldGroupQuery query) {
        return Result.ok(fieldGroupService.page(query));
    }

    @GetMapping("/all")
    @Operation(summary = "获取全部字段分组")
    @PreAuthorize("@perm.has('system:fieldGroup:list')")
    public Result<List<FieldGroupVo>> all() {
        return Result.ok(fieldGroupService.all());
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取字段分组详情")
    @PreAuthorize("@perm.has('system:fieldGroup:query')")
    public Result<FieldGroupVo> detail(@PathVariable Integer id) {
        return Result.ok(fieldGroupService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增字段分组")
    @PreAuthorize("@perm.has('system:fieldGroup:add')")
    @OperLog(title = "字段分组", businessType = "1")
    public Result<Void> create(@Valid @RequestBody FieldGroupSaveDto dto) {
        fieldGroupService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改字段分组")
    @PreAuthorize("@perm.has('system:fieldGroup:edit')")
    @OperLog(title = "字段分组", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody FieldGroupSaveDto dto) {
        fieldGroupService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除字段分组")
    @PreAuthorize("@perm.has('system:fieldGroup:delete')")
    @OperLog(title = "字段分组", businessType = "3")
    public Result<Void> batchDelete(@Valid @RequestBody IdsDto dto) {
        fieldGroupService.batchDelete(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除字段分组")
    @PreAuthorize("@perm.has('system:fieldGroup:delete')")
    @OperLog(title = "字段分组", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        fieldGroupService.delete(id);
        return Result.ok();
    }
}
