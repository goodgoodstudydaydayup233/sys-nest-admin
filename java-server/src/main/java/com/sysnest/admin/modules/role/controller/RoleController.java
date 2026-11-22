package com.sysnest.admin.modules.role.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.role.dto.RoleQuery;
import com.sysnest.admin.modules.role.dto.RoleSaveDto;
import com.sysnest.admin.modules.role.service.RoleService;
import com.sysnest.admin.modules.role.vo.RoleVo;
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
 * 角色管理接口，对应 Nest 的 role.controller.ts
 */
@RestController
@RequestMapping("/role")
@RequiredArgsConstructor
@Tag(name = "角色管理")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @Operation(summary = "获取角色列表")
    @PreAuthorize("@perm.has('system:role:list')")
    public Result<PageResult<RoleVo>> page(@Valid RoleQuery query) {
        return Result.ok(roleService.page(query));
    }

    @GetMapping("/all")
    @Operation(summary = "获取全部角色")
    @PreAuthorize("@perm.has('system:role:list')")
    public Result<List<RoleVo>> all() {
        return Result.ok(roleService.all());
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取角色详情")
    @PreAuthorize("@perm.has('system:role:query')")
    public Result<RoleVo> detail(@PathVariable Integer id) {
        return Result.ok(roleService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增角色")
    @PreAuthorize("@perm.has('system:role:add')")
    @OperLog(title = "角色管理", businessType = "1")
    public Result<Void> create(@Valid @RequestBody RoleSaveDto dto) {
        roleService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改角色")
    @PreAuthorize("@perm.has('system:role:edit')")
    @OperLog(title = "角色管理", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody RoleSaveDto dto) {
        roleService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除角色")
    @PreAuthorize("@perm.has('system:role:delete')")
    @OperLog(title = "角色管理", businessType = "3")
    public Result<Void> batchDelete(@Valid @RequestBody IdsDto dto) {
        roleService.batchDelete(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除角色")
    @PreAuthorize("@perm.has('system:role:delete')")
    @OperLog(title = "角色管理", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        roleService.delete(id);
        return Result.ok();
    }
}
