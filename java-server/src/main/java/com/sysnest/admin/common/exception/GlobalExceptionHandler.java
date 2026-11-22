package com.sysnest.admin.common.exception;

import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.common.enums.ErrorCode;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器，相当于 Nest 的 business-exception.filter + http-exception.filter
 * 业务代码只负责抛异常，这里统一转成 { code, msg, data }
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 自己抛的业务异常：原样返回错误码和提示 */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常：code={}, msg={}", e.getCode(), e.getMessage());
        return Result.fail(e.getCode(), e.getMessage());
    }

    /** 请求体校验失败（@RequestBody + @Valid） */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        String msg = firstErrorMessage(e.getBindingResult().getFieldErrors());
        log.warn("参数校验失败：{}", msg);
        return Result.fail(ErrorCode.BAD_REQUEST, msg);
    }

    /** 查询参数绑定失败 */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(BindException.class)
    public Result<Void> handleBindException(BindException e) {
        String msg = firstErrorMessage(e.getBindingResult().getFieldErrors());
        log.warn("参数绑定失败：{}", msg);
        return Result.fail(ErrorCode.BAD_REQUEST, msg);
    }

    /** 方法参数校验失败（类上 @Validated + 参数注解） */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(ConstraintViolationException.class)
    public Result<Void> handleConstraintViolation(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .findFirst()
                .map(v -> v.getMessage())
                .orElse(ErrorCode.BAD_REQUEST.getMsg());
        log.warn("参数校验失败：{}", msg);
        return Result.fail(ErrorCode.BAD_REQUEST, msg);
    }

    /** 请求体不是合法 JSON 或字段类型无法转换 */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public Result<Void> handleMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("请求体解析失败：{}", e.getMessage());
        return Result.fail(ErrorCode.BAD_REQUEST, "请求参数格式错误");
    }

    /** @PreAuthorize 没通过 */
    @ExceptionHandler(AccessDeniedException.class)
    public Result<Void> handleAccessDenied(AccessDeniedException e) {
        log.warn("权限不足：{}", e.getMessage());
        return Result.fail(ErrorCode.NO_PERMISSION);
    }

    /** 兜底：其它所有异常 */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    private String firstErrorMessage(java.util.List<FieldError> fieldErrors) {
        return fieldErrors.stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse(ErrorCode.PARAM_ERROR.getMsg());
    }
}
