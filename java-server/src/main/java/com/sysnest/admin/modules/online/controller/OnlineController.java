package com.sysnest.admin.modules.online.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.online.dto.OnlineQuery;
import com.sysnest.admin.modules.online.entity.OnlineUser;
import com.sysnest.admin.modules.online.service.OnlineUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 在线用户接口，对应 Nest 的 online.controller.ts
 */
@RestController
@RequestMapping("/monitor/online")
@RequiredArgsConstructor
@Tag(name = "在线用户")
public class OnlineController {

    private final OnlineUserService onlineUserService;

    @GetMapping("/list")
    @Operation(summary = "查询在线用户列表")
    @PreAuthorize("@perm.has('monitor:online:list')")
    public Result<List<OnlineUser>> list(OnlineQuery query) {
        return Result.ok(onlineUserService.list(query));
    }

    @DeleteMapping("/{tokenId}")
    @Operation(summary = "强退用户")
    @PreAuthorize("@perm.has('monitor:online:forceLogout')")
    @OperLog(title = "在线用户", businessType = "7")
    public Result<Void> forceLogout(@PathVariable String tokenId) {
        onlineUserService.forceLogoutByToken(tokenId);
        return Result.ok();
    }
}
