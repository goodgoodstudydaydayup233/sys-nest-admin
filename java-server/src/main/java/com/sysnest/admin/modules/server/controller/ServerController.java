package com.sysnest.admin.modules.server.controller;

import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.server.service.ServerService;
import com.sysnest.admin.modules.server.vo.ServerVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 服务监控接口，对应 Nest 的 server.controller.ts
 */
@RestController
@RequestMapping("/monitor/server")
@RequiredArgsConstructor
@Tag(name = "服务监控")
public class ServerController {

    private final ServerService serverService;

    @GetMapping
    @Operation(summary = "获取服务监控信息")
    @PreAuthorize("@perm.has('monitor:server:list')")
    public Result<ServerVo> info() {
        return Result.ok(serverService.getServerInfo());
    }
}
