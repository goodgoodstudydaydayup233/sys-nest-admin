package com.sysnest.admin.modules.job.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 示例定时任务 Bean，对应 Nest 的 sample-task.ts
 * 调用目标写法：beanName.method(args)，例如 stTask.stParams('st')
 */
@Slf4j
@Component("stTask")
public class SampleTask {

    /** 无参任务 */
    public String stNoParams() {
        log.info("执行无参示例任务：stNoParams");
        return "stNoParams 执行成功";
    }

    /** 单参任务 */
    public String stParams(String param) {
        log.info("执行单参示例任务：stParams({})", param);
        return "stParams(" + param + ") 执行成功";
    }

    /** 多参任务 */
    public String stMultipleParams(String s, Integer n, Boolean b) {
        log.info("执行多参示例任务：stMultipleParams({}, {}, {})", s, n, b);
        return "stMultipleParams(" + s + ", " + n + ", " + b + ") 执行成功";
    }

    /** 字符串参任务 */
    public String stString(String str) {
        log.info("执行字符串参示例任务：stString({})", str);
        return "stString(" + str + ") 执行成功";
    }
}
