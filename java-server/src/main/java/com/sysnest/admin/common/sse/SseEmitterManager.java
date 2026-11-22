package com.sysnest.admin.common.sse;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE 连接管理器，相当于 Nest 的 message-sse.service.ts 的基础部分
 * 负责按用户保存连接、心跳保活、断线清理和消息推送
 */
@Slf4j
@Component
public class SseEmitterManager {

    /** 连接超时：30 分钟，前端断线后会重连 */
    private static final long EMITTER_TIMEOUT = 30 * 60 * 1000L;

    private final Map<Integer, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "sse-heartbeat");
        thread.setDaemon(true);
        return thread;
    });

    public SseEmitterManager() {
        // 25 秒发一次注释帧，防止 Nginx/浏览器把空闲连接掐掉
        heartbeatExecutor.scheduleAtFixedRate(this::heartbeat, 25, 25, TimeUnit.SECONDS);
    }

    /**
     * 建立连接
     */
    public SseEmitter connect(Integer userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);
        emitters.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));
        return emitter;
    }

    /**
     * 给指定用户推送事件
     */
    public void sendToUser(Integer userId, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException | IllegalStateException e) {
                remove(userId, emitter);
            }
        }
    }

    /**
     * 当前在线连接数（按用户）
     */
    public int onlineUserCount() {
        return emitters.size();
    }

    private void remove(Integer userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }
        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }
    }

    private void heartbeat() {
        emitters.forEach((userId, userEmitters) -> {
            for (SseEmitter emitter : userEmitters) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (IOException | IllegalStateException e) {
                    remove(userId, emitter);
                }
            }
        });
    }

    @PreDestroy
    public void shutdown() {
        heartbeatExecutor.shutdownNow();
        emitters.values().forEach(list -> list.forEach(SseEmitter::complete));
        emitters.clear();
    }
}
