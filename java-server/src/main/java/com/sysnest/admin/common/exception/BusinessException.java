package com.sysnest.admin.common.exception;

import com.sysnest.admin.common.enums.ErrorCode;
import lombok.Getter;

/**
 * 业务异常，相当于 Nest 的 business.exception.ts
 * 业务代码里直接 throw，由全局异常处理器统一转成 JSON
 */
@Getter
public class BusinessException extends RuntimeException {

    /** 业务错误码 */
    private final int code;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMsg());
        this.code = errorCode.getCode();
    }

    public BusinessException(ErrorCode errorCode, String msg) {
        super(msg);
        this.code = errorCode.getCode();
    }

    public BusinessException(int code, String msg) {
        super(msg);
        this.code = code;
    }
}
