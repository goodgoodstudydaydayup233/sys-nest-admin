package com.sysnest.admin.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 限流注解，相当于 Nest 的 @RateLimiter
 * 贴在 Controller 方法上，覆盖默认的限流规则
 *
 * 用法：@RateLimit(time = 60, count = 10, dimension = RateLimit.Dimension.IP)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /** 时间窗口（秒） */
    long time() default 60;

    /** 时间窗口内最大请求次数 */
    long count() default 100;

    /** 限流维度 */
    Dimension dimension() default Dimension.DEFAULT;

    enum Dimension {
        /** 接口 + IP */
        DEFAULT,
        /** 仅 IP */
        IP,
        /** 用户 + 接口（未登录降级为接口 + IP） */
        USER
    }
}
