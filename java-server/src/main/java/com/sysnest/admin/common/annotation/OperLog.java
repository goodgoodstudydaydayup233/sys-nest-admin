package com.sysnest.admin.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解，相当于 Nest 的 @Log()
 * 贴在 Controller 方法上，AOP 会自动把操作人、参数、结果、耗时写进 sys_oper_log
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperLog {

    /** 模块标题，如“用户管理” */
    String title();

    /**
     * 业务类型，和 Nest 端枚举一致：
     * 0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8生成代码 9清空
     */
    String businessType() default "0";
}
