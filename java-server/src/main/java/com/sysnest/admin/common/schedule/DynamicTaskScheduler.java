package com.sysnest.admin.common.schedule;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 动态定时任务调度器，相当于 Nest 的 cron-schedule.service.ts
 * 支持按任务 ID 注册 / 取消，后续 job 模块直接复用它
 */
@Slf4j
@Component
public class DynamicTaskScheduler {

    private final ThreadPoolTaskScheduler scheduler;
    private final Map<Integer, ScheduledFuture<?>> tasks = new ConcurrentHashMap<>();

    public DynamicTaskScheduler() {
        this.scheduler = new ThreadPoolTaskScheduler();
        this.scheduler.setPoolSize(4);
        this.scheduler.setThreadNamePrefix("dynamic-task-");
        this.scheduler.initialize();
    }

    /**
     * 注册或覆盖一个 cron 任务
     *
     * @param taskId 任务 ID（数据库主键）
     * @param cron   cron 表达式
     * @param task   任务体
     */
    public void schedule(int taskId, String cron, Runnable task) {
        cancel(taskId);
        ScheduledFuture<?> future = scheduler.schedule(task, new CronTrigger(cron));
        tasks.put(taskId, future);
        log.info("定时任务已注册：taskId={}, cron={}", taskId, cron);
    }

    /**
     * 取消任务
     */
    public void cancel(int taskId) {
        ScheduledFuture<?> future = tasks.remove(taskId);
        if (future != null) {
            future.cancel(true);
            log.info("定时任务已取消：taskId={}", taskId);
        }
    }

    /**
     * 立即执行一次，不影响原有调度
     */
    public void runOnce(Runnable task) {
        scheduler.execute(task);
    }

    public boolean isScheduled(int taskId) {
        return tasks.containsKey(taskId);
    }

    @PreDestroy
    public void shutdown() {
        tasks.values().forEach(future -> future.cancel(true));
        tasks.clear();
        scheduler.shutdown();
    }
}
