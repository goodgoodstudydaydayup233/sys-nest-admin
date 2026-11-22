package com.sysnest.admin.modules.server.vo;

import lombok.Data;

import java.util.List;

/**
 * 服务监控返回结构，字段与 Nest 端 ServerVo 完全一致
 * 其中 node / jvm 在 Java 端都返回 JVM 运行时信息，方便前端不改字段直接复用
 */
@Data
public class ServerVo {

    private CpuVo cpu;
    private MemVo mem;
    private SysVo sys;

    /** 运行时信息（前端 Node 字段） */
    private RuntimeVo node;

    /** 运行时信息（前端 JVM 字段） */
    private RuntimeVo jvm;

    private List<DiskVo> sysFiles;

    @Data
    public static class CpuVo {
        /** 核心数 */
        private int cpuNum;
        /** CPU 总使用率 (%) */
        private double used;
        /** 系统使用率 (%) */
        private double sys;
        /** 用户使用率 (%) */
        private double user;
        /** CPU 型号 */
        private String model;
        /** 主频 (GHz) */
        private double speed;
    }

    @Data
    public static class MemVo {
        /** 内存总量 (GB) */
        private double total;
        /** 已用内存 (GB) */
        private double used;
        /** 空闲内存 (GB) */
        private double free;
        /** 内存使用率 (%) */
        private double usage;
    }

    @Data
    public static class SysVo {
        private String computerName;
        private String computerIp;
        private String osName;
        private String osArch;
        private String userDir;
        private String sysTime;
        /** 运行时长（秒） */
        private long uptime;
    }

    @Data
    public static class RuntimeVo {
        /** Java 版本（对应 Node.js 版本字段） */
        private String nodeVersion;
        /** Spring Boot 版本（对应 NestJS 版本字段） */
        private String nestVersion;
        /** 进程运行时长（秒） */
        private long runTime;
        /** Java 安装路径 */
        private String home;
        /** 最大可用内存 (GB) */
        private double totalMemory;
        /** 已用堆内存 (GB) */
        private double usedMemory;
        /** 空闲内存 (GB) */
        private double freeMemory;
        /** 最大可用内存 (GB) */
        private double maxMemory;
    }

    @Data
    public static class DiskVo {
        private String dirName;
        private String sysTypeName;
        private String typeName;
        private double total;
        private double used;
        private double free;
        private double usage;
    }
}
