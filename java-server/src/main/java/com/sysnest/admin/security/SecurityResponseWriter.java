package com.sysnest.admin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.common.enums.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 在过滤器里手动写 JSON 响应的小工具
 * 请求没进 Controller 就被 Security 拦下时，全局异常处理器接不到，只能自己写
 */
public final class SecurityResponseWriter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private SecurityResponseWriter() {
    }

    public static void write(HttpServletResponse response, HttpStatus status, ErrorCode errorCode) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(Result.fail(errorCode)));
    }
}
