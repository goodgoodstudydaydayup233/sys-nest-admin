package com.sysnest.admin.modules.log.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sysnest.admin.common.annotation.OperLog;
import com.sysnest.admin.common.util.IpUtils;
import com.sysnest.admin.modules.log.entity.SysOperLog;
import com.sysnest.admin.modules.log.mapper.SysOperLogMapper;
import com.sysnest.admin.security.SecurityUtils;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;

/**
 * 操作日志切面，相当于 Nest 的 logging.interceptor.ts
 * 有 @OperLog 的方法执行前后自动采集信息并落库，不影响业务异常继续向上抛
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperLogAspect {

    private static final int MAX_TEXT_LENGTH = 2000;

    private final SysOperLogMapper sysOperLogMapper;
    private final ObjectMapper objectMapper;

    @Around("@annotation(operLog)")
    public Object around(ProceedingJoinPoint joinPoint, OperLog operLog) throws Throwable {
        long start = System.currentTimeMillis();
        SysOperLog entity = buildBaseLog(joinPoint, operLog);

        try {
            Object result = joinPoint.proceed();
            entity.setStatus("0");
            entity.setJsonResult(toJson(result));
            return result;
        } catch (Throwable e) {
            entity.setStatus("1");
            entity.setErrorMsg(truncate(e.getMessage()));
            throw e;
        } finally {
            entity.setCostTime(System.currentTimeMillis() - start);
            saveQuietly(entity);
        }
    }

    private SysOperLog buildBaseLog(ProceedingJoinPoint joinPoint, OperLog operLog) {
        SysOperLog entity = new SysOperLog();
        entity.setTitle(operLog.title());
        entity.setBusinessType(operLog.businessType());
        entity.setMethod(joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName());
        entity.setOperName(SecurityUtils.currentUsernameOrDefault("system"));

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            entity.setRequestMethod(request.getMethod());
            entity.setOperUrl(request.getRequestURI());
            entity.setOperIp(IpUtils.getClientIp(request));
        }

        // 过滤掉请求/响应/文件这类无法序列化的参数
        Object[] args = Arrays.stream(joinPoint.getArgs())
                .filter(arg -> !(arg instanceof ServletRequest)
                        && !(arg instanceof ServletResponse)
                        && !(arg instanceof MultipartFile))
                .toArray();
        entity.setOperParam(toJson(args));
        return entity;
    }

    private void saveQuietly(SysOperLog entity) {
        try {
            sysOperLogMapper.insert(entity);
        } catch (Exception e) {
            // 日志失败不能影响业务
            log.warn("操作日志保存失败：{}", e.getMessage());
        }
    }

    private String toJson(Object value) {
        try {
            return truncate(objectMapper.writeValueAsString(value));
        } catch (Exception e) {
            return "";
        }
    }

    private String truncate(String text) {
        if (text == null) {
            return null;
        }
        return text.length() <= MAX_TEXT_LENGTH ? text : text.substring(0, MAX_TEXT_LENGTH);
    }
}
