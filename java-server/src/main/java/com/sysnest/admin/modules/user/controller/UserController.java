package com.sysnest.admin.modules.user.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.IdsDto;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.user.dto.PasswordDto;
import com.sysnest.admin.modules.user.dto.ProfileDto;
import com.sysnest.admin.modules.user.dto.ResetPasswordDto;
import com.sysnest.admin.modules.user.dto.UserQuery;
import com.sysnest.admin.modules.user.dto.UserSaveDto;
import com.sysnest.admin.modules.user.service.UserService;
import com.sysnest.admin.modules.user.vo.UserVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 用户管理接口，对应 Nest 的 user.controller.ts
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Tag(name = "用户管理")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "获取用户列表")
    @PreAuthorize("@perm.has('system:user:list')")
    public Result<PageResult<UserVo>> page(@Valid UserQuery query) {
        return Result.ok(userService.page(query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取用户详情")
    @PreAuthorize("@perm.has('system:user:query')")
    public Result<UserVo> detail(@PathVariable Integer id) {
        return Result.ok(userService.detail(id));
    }

    /**
     * 新增用户，前端以 multipart 提交，角色字段为 roleIds[]
     */
    @PostMapping
    @Operation(summary = "新增用户")
    @PreAuthorize("@perm.has('system:user:add')")
    @OperLog(title = "用户管理", businessType = "1")
    public Result<Void> create(@Valid @ModelAttribute UserSaveDto dto,
                               @RequestParam(value = "roleIds[]", required = false) List<Integer> roleIds,
                               @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile) {
        userService.create(dto, roleIds, avatarFile);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改用户")
    @PreAuthorize("@perm.has('system:user:edit')")
    @OperLog(title = "用户管理", businessType = "2")
    public Result<Void> update(@PathVariable Integer id,
                               @Valid @ModelAttribute UserSaveDto dto,
                               @RequestParam(value = "roleIds[]", required = false) List<Integer> roleIds,
                               @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile) {
        userService.update(id, dto, roleIds, avatarFile);
        return Result.ok();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "批量删除用户")
    @PreAuthorize("@perm.has('system:user:delete')")
    @OperLog(title = "用户管理", businessType = "3")
    public Result<Void> batchDelete(@Valid @RequestBody IdsDto dto) {
        userService.batchDelete(dto.getIds());
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除用户")
    @PreAuthorize("@perm.has('system:user:delete')")
    @OperLog(title = "用户管理", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        userService.delete(id);
        return Result.ok();
    }

    @PutMapping("/{id}/changePassword")
    @Operation(summary = "修改指定用户密码")
    @PreAuthorize("@perm.has('system:user:edit')")
    @OperLog(title = "用户管理", businessType = "2")
    public Result<Void> changePassword(@PathVariable Integer id, @Valid @RequestBody PasswordDto dto) {
        userService.changePassword(id, dto);
        return Result.ok();
    }

    @PutMapping("/{id}/resetPassword")
    @Operation(summary = "重置指定用户密码")
    @PreAuthorize("@perm.has('system:user:resetPassword')")
    @OperLog(title = "用户管理", businessType = "2")
    public Result<Void> resetPassword(@PathVariable Integer id, @Valid @RequestBody ResetPasswordDto dto) {
        userService.resetPassword(id, dto);
        return Result.ok();
    }

    @PutMapping("/profile")
    @Operation(summary = "修改个人信息")
    @OperLog(title = "个人信息", businessType = "2")
    public Result<Void> profile(@Valid @ModelAttribute ProfileDto dto,
                                @RequestPart(value = "avatarFile", required = false) MultipartFile avatarFile) {
        userService.updateProfile(dto, avatarFile);
        return Result.ok();
    }

    @PutMapping("/password")
    @Operation(summary = "修改本人密码")
    @OperLog(title = "个人信息", businessType = "2")
    public Result<Void> password(@Valid @RequestBody PasswordDto dto) {
        userService.changeOwnPassword(dto);
        return Result.ok();
    }

    @PutMapping("/avatar")
    @Operation(summary = "上传头像")
    @OperLog(title = "个人信息", businessType = "2")
    public Result<Void> avatar(@RequestPart("avatarFile") MultipartFile avatarFile) {
        userService.updateAvatar(avatarFile);
        return Result.ok();
    }
}
