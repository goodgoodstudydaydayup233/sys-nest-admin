package com.sysnest.admin.modules.dict.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.dict.dto.DictTypeQuery;
import com.sysnest.admin.modules.dict.dto.DictTypeSaveDto;
import com.sysnest.admin.modules.dict.service.DictTypeService;
import com.sysnest.admin.modules.dict.vo.DictTypeVo;
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

import java.util.Map;

/**
 * 字典类型接口
 */
@RestController
@RequestMapping("/dict-type")
@RequiredArgsConstructor
@Tag(name = "字典类型")
public class DictTypeController {

    private final DictTypeService dictTypeService;

    @GetMapping
    @Operation(summary = "获取字典类型列表")
    @PreAuthorize("@perm.has('system:dictType:list')")
    public Result<PageResult<DictTypeVo>> page(@Valid DictTypeQuery query) {
        return Result.ok(dictTypeService.page(query));
    }

    @GetMapping("/refresh")
    @Operation(summary = "刷新字典缓存")
    @PreAuthorize("@perm.has('system:dictType:edit')")
    @OperLog(title = "字典类型", businessType = "0")
    public Result<Map<String, Integer>> refresh() {
        return Result.ok(Map.of("count", dictTypeService.refresh()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取字典类型详情")
    @PreAuthorize("@perm.has('system:dictType:query')")
    public Result<DictTypeVo> detail(@PathVariable Integer id) {
        return Result.ok(dictTypeService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增字典类型")
    @PreAuthorize("@perm.has('system:dictType:add')")
    @OperLog(title = "字典类型", businessType = "1")
    public Result<Void> create(@Valid @RequestBody DictTypeSaveDto dto) {
        dictTypeService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改字典类型")
    @PreAuthorize("@perm.has('system:dictType:edit')")
    @OperLog(title = "字典类型", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody DictTypeSaveDto dto) {
        dictTypeService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除字典类型")
    @PreAuthorize("@perm.has('system:dictType:delete')")
    @OperLog(title = "字典类型", businessType = "3")
    public Result<Void> batchDelete(@Valid @RequestBody IdsDto dto) {
        dictTypeService.batchDelete(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除字典类型")
    @PreAuthorize("@perm.has('system:dictType:delete')")
    @OperLog(title = "字典类型", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        dictTypeService.delete(id);
        return Result.ok();
    }
}
