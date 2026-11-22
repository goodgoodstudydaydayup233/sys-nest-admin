package com.sysnest.admin.modules.message.controller;

import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.common.sse.SseEmitterManager;
import com.sysnest.admin.modules.message.dto.MessageQuery;
import com.sysnest.admin.modules.message.dto.MessageSendDto;
import com.sysnest.admin.modules.message.service.MessageService;
import com.sysnest.admin.modules.message.vo.MessageVo;
import com.sysnest.admin.security.JwtTokenProvider;
import com.sysnest.admin.security.LoginUser;
import com.sysnest.admin.security.TokenBlacklistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

/**
 * 站内信接口，对应 Nest 的 message.controller.ts
 */
@RestController
@RequestMapping("/system/message")
@RequiredArgsConstructor
@Tag(name = "站内信")
public class MessageController {

    private final MessageService messageService;
    private final SseEmitterManager sseEmitterManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @PostMapping
    @Operation(summary = "发送站内信")
    @PreAuthorize("@perm.has('system:message:send')")
    @OperLog(title = "站内信", businessType = "1")
    public Result<Integer> send(@Valid @RequestBody MessageSendDto dto) {
        return Result.ok(messageService.send(dto));
    }

    @GetMapping("/inbox")
    @Operation(summary = "获取本人收件箱")
    public Result<PageResult<MessageVo>> inbox(@Valid MessageQuery query) {
        return Result.ok(messageService.inbox(query));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "获取本人未读数量")
    public Result<Map<String, Long>> unreadCount() {
        return Result.ok(Map.of("count", messageService.unreadCount()));
    }

    @PutMapping("/read-all")
    @Operation(summary = "全部标记已读")
    public Result<Void> readAll() {
        messageService.readAll();
        return Result.ok();
    }

    /**
     * SSE 长连接：EventSource 无法带 Authorization 头，token 从 query 传入
     */
    @GetMapping("/sse")
    @Operation(summary = "站内信 SSE 实时推送（token 通过 query 传递）")
    public ResponseEntity<SseEmitter> sse(@RequestParam(value = "token", required = false) String token) {
        if (!StringUtils.hasText(token)) {
            return ResponseEntity.<SseEmitter>status(HttpStatus.UNAUTHORIZED).build();
        }

        LoginUser loginUser;
        try {
            if (tokenBlacklistService.isBlacklisted(token)) {
                return ResponseEntity.<SseEmitter>status(HttpStatus.UNAUTHORIZED).build();
            }
            loginUser = jwtTokenProvider.parseAccessToken(token);
        } catch (Exception e) {
            return ResponseEntity.<SseEmitter>status(HttpStatus.UNAUTHORIZED).build();
        }

        SseEmitter emitter = sseEmitterManager.connect(loginUser.getUserId());
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException | IllegalStateException e) {
            emitter.completeWithError(e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_EVENT_STREAM);
        headers.setCacheControl("no-cache");
        headers.setConnection("keep-alive");
        // 让 Nginx 不要缓冲 SSE 输出
        headers.set("X-Accel-Buffering", "no");
        return new ResponseEntity<>(emitter, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取站内信详情")
    public Result<MessageVo> detail(@PathVariable Integer id) {
        return Result.ok(messageService.detail(id));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "单条标记已读")
    public Result<Void> read(@PathVariable Integer id) {
        messageService.read(id);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除站内信")
    @PreAuthorize("@perm.has('system:message:remove')")
    @OperLog(title = "站内信", businessType = "3")
    public Result<Void> delete(@PathVariable Integer id) {
        messageService.delete(id);
        return Result.ok();
    }
}
