package com.sysnest.admin.common.logging;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 进程未捕获异常兜底：线程里漏掉的异常也写进 logs/error
 */
@Component
public class GlobalUncaughtExceptionHandler {

    private static final Logger ERROR_LOG = LoggerFactory.getLogger("ERROR");

    @PostConstruct
    public void register() {
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) ->
                ERROR_LOG.error("未捕获异常，线程：{}", thread.getName(), throwable));
    }
}
