package com.sysnest.admin.modules.config.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.config.dto.ConfigQuery;
import com.sysnest.admin.modules.config.dto.ConfigSaveDto;
import com.sysnest.admin.modules.config.service.SysConfigService;
import com.sysnest.admin.modules.config.vo.ConfigVo;
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
 * 参数配置接口，对应 Nest 的 config.controller.ts
 */
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
@Tag(name = "参数配置")
public class ConfigController {

    private final SysConfigService sysConfigService;

    @GetMapping
    @Operation(summary = "获取配置列表")
    @PreAuthorize("@perm.has('system:config:list')")
    public Result<PageResult<ConfigVo>> page(@Valid ConfigQuery query) {
        return Result.ok(sysConfigService.page(query));
    }

    @GetMapping("/key/{configKey}")
    @Operation(summary = "按键获取配置值")
    @PreAuthorize("@perm.has('system:config:query')")
    public Result<String> value(@PathVariable String configKey) {
        return Result.ok(sysConfigService.getValueOrNull(configKey));
    }

    @DeleteMapping("/refreshCache")
    @Operation(summary = "刷新配置缓存")
    @PreAuthorize("@perm.has('system:config:remove')")
    @OperLog(title = "参数配置", businessType = "0")
    public Result<Map<String, Integer>> refreshCache() {
        return Result.ok(Map.of("count", sysConfigService.refreshCache()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取配置详情")
    @PreAuthorize("@perm.has('system:config:query')")
    public Result<ConfigVo> detail(@PathVariable Integer id) {
        return Result.ok(sysConfigService.detail(id));
    }

    @PostMapping
    @Operation(summary = "新增配置")
    @PreAuthorize("@perm.has('system:config:add')")
    @OperLog(title = "参数配置", businessType = "1")
    public Result<Void> create(@Valid @RequestBody ConfigSaveDto dto) {
        sysConfigService.create(dto);
        return Result.ok();
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改配置")
    @PreAuthorize("@perm.has('system:config:edit')")
    @OperLog(title = "参数配置", businessType = "2")
    public Result<Void> update(@PathVariable Integer id, @Valid @RequestBody ConfigSaveDto dto) {
        sysConfigService.update(id, dto);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除配置")
    @PreAuthorize("@perm.has('system:config:delete')")
    @OperLog(title = "参数配置", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        sysConfigService.delete(id);
        return Result.ok();
    }
}
