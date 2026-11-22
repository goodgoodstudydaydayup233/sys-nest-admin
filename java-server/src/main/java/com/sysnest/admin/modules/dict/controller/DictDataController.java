package com.sysnest.admin.modules.dict.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.dict.dto.DictDataQuery;
import com.sysnest.admin.modules.dict.dto.DictDataSaveDto;
import com.sysnest.admin.modules.dict.service.DictDataService;
import com.sysnest.admin.modules.dict.vo.DictDataVo;
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
 * 字典数据接口
 */
@RestController
@RequestMapping("/dict-data")
@RequiredArgsConstructor
@Tag(name = "字典数据")
public class DictDataController {

    private final DictDataService dictDataService;

    @GetMapping
    @Operation(summary = "获取字典数据列表")
    @PreAuthorize("@perm.has('system:dictData:list')")
    public Result<PageResult<DictDataVo>> page(@Valid DictDataQuery query) {
        return Result.ok(dictDataService.page(query));
    }

    /**
     * 按类型取启用数据，前端下拉框用，仅需登录
     */
    @GetMapping("/type/{dictType}")
    @Operation(summary = "按字典类型获取数据")
    public Result<List<DictDataVo>> byType(@PathVariable String dictType) {
        return Result.ok(dictDataService.byType(dictType));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取字典数据详情")
    @PreAuthorize("@perm.has('system:dictData:query')")
    public Result<DictDataVo> detail(@PathVariable Integer id) {
        return Result.ok(dictDataService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增字典数据")
    @PreAuthorize("@perm.has('system:dictData:add')")
    @OperLog(title = "字典数据", businessType = "1")
    public Result<Void> create(@Valid @RequestBody DictDataSaveDto dto) {
        dictDataService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改字典数据")
    @PreAuthorize("@perm.has('system:dictData:edit')")
    @OperLog(title = "字典数据", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody DictDataSaveDto dto) {
        dictDataService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除字典数据")
    @PreAuthorize("@perm.has('system:dictData:delete')")
    @OperLog(title = "字典数据", businessType = "3")
    public Result<Void> batchDelete(@Valid @RequestBody IdsDto dto) {
        dictDataService.batchDelete(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除字典数据")
    @PreAuthorize("@perm.has('system:dictData:delete')")
    @OperLog(title = "字典数据", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        dictDataService.delete(id);
        return Result.ok();
    }
}
