package com.sysnest.admin.modules.menu.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.menu.dto.MenuQuery;
import com.sysnest.admin.modules.menu.dto.MenuSaveDto;
import com.sysnest.admin.modules.menu.service.MenuService;
import com.sysnest.admin.modules.menu.vo.MenuTreeVo;
import com.sysnest.admin.modules.menu.vo.MenuVo;
import com.sysnest.admin.modules.menu.vo.RoleMenuTreeVo;
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
 * 菜单管理接口，对应 Nest 的 menu.controller.ts
 */
@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
@Tag(name = "菜单管理")
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    @Operation(summary = "获取菜单列表")
    @PreAuthorize("@perm.has('system:menu:list')")
    public Result<List<MenuVo>> list(@Valid MenuQuery query) {
        return Result.ok(menuService.list(query));
    }

    @GetMapping("/tree")
    @Operation(summary = "获取菜单树")
    @PreAuthorize("@perm.has('system:menu:list')")
    public Result<List<MenuTreeVo>> tree() {
        return Result.ok(menuService.tree());
    }

    @GetMapping("/roleMenuTreeselect/{id}")
    @Operation(summary = "获取角色菜单树")
    @PreAuthorize("@perm.has('system:menu:query')")
    public Result<RoleMenuTreeVo> roleMenuTree(@PathVariable Integer id) {
        return Result.ok(menuService.roleMenuTree(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取菜单详情")
    @PreAuthorize("@perm.has('system:menu:query')")
    public Result<MenuVo> detail(@PathVariable Integer id) {
        return Result.ok(menuService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增菜单")
    @PreAuthorize("@perm.has('system:menu:add')")
    @OperLog(title = "菜单管理", businessType = "1")
    public Result<Void> create(@Valid @RequestBody MenuSaveDto dto) {
        menuService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改菜单")
    @PreAuthorize("@perm.has('system:menu:edit')")
    @OperLog(title = "菜单管理", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody MenuSaveDto dto) {
        menuService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除菜单")
    @PreAuthorize("@perm.has('system:menu:delete')")
    @OperLog(title = "菜单管理", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        menuService.delete(id);
        return Result.ok();
    }
}
