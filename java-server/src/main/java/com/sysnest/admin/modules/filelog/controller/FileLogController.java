package com.sysnest.admin.modules.filelog.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.filelog.dto.FileLogEntriesQuery;
import com.sysnest.admin.modules.filelog.dto.FileLogFilesQuery;
import com.sysnest.admin.modules.filelog.dto.FileLogRawQuery;
import com.sysnest.admin.modules.filelog.dto.FileLogRemoveDto;
import com.sysnest.admin.modules.filelog.service.FileLogService;
import com.sysnest.admin.modules.filelog.vo.FileLogEntriesVo;
import com.sysnest.admin.modules.filelog.vo.FileLogFilesVo;
import com.sysnest.admin.modules.filelog.vo.FileLogRawVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 文件日志接口，对应 Nest 的 file-log.controller.ts
 */
@RestController
@RequestMapping("/file-log")
@RequiredArgsConstructor
@Tag(name = "文件日志")
public class FileLogController {

    private final FileLogService fileLogService;

    @GetMapping("/files")
    @Operation(summary = "获取日志文件列表")
    @PreAuthorize("@perm.has('monitor:fileLog:list')")
    public Result<FileLogFilesVo> files(@Valid FileLogFilesQuery query) {
        return Result.ok(fileLogService.listFiles(query));
    }

    @GetMapping("/entries")
    @Operation(summary = "查询日志内容")
    @PreAuthorize("@perm.has('monitor:fileLog:query')")
    public Result<FileLogEntriesVo> entries(@Valid FileLogEntriesQuery query) {
        return Result.ok(fileLogService.readEntries(query));
    }

    @GetMapping("/raw")
    @Operation(summary = "预览日志文件原始内容")
    @PreAuthorize("@perm.has('monitor:fileLog:query')")
    public Result<FileLogRawVo> raw(@Valid FileLogRawQuery query) {
        return Result.ok(fileLogService.readRaw(query));
    }

    @GetMapping("/download")
    @Operation(summary = "下载日志文件")
    @PreAuthorize("@perm.has('monitor:fileLog:download')")
    public ResponseEntity<Resource> download(@RequestParam("name") String name) {
        Path path = fileLogService.resolveFilePath(name);
        if (!Files.isRegularFile(path)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "日志文件不存在: " + name);
        }
        try {
            ContentDisposition disposition = ContentDisposition.attachment()
                    .filename(name, StandardCharsets.UTF_8)
                    .build();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(Files.size(path))
                    .body(new FileSystemResource(path));
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "下载日志文件失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/file")
    @Operation(summary = "删除日志文件")
    @PreAuthorize("@perm.has('monitor:fileLog:remove')")
    @OperLog(title = "文件日志", businessType = "3")
    public Result<Void> remove(@Valid @RequestBody FileLogRemoveDto dto) {
        fileLogService.removeFile(dto.getName());
        return Result.ok();
    }
}
