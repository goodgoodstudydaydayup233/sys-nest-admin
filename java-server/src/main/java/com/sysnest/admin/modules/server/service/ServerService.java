package com.sysnest.admin.modules.server.service;

import com.sysnest.admin.modules.server.vo.ServerVo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringBootVersion;
import org.springframework.stereotype.Service;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

/**
 * 服务监控，对应 Nest 的 server.service.ts
 *
 * Nest 端用 systeminformation 采集，这里用 JDK 自带的 MXBean + File/NetworkInterface，
 * 不额外引入第三方库，字段结构保持和前端一致。
 */
@Slf4j
@Service
public class ServerService {

    private static final double BYTES_PER_GB = 1024.0 * 1024.0 * 1024.0;
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ServerVo getServerInfo() {
        com.sun.management.OperatingSystemMXBean osBean =
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

        ServerVo vo = new ServerVo();
        vo.setCpu(buildCpu(osBean));
        vo.setMem(buildMem(osBean));
        vo.setSys(buildSys());
        ServerVo.RuntimeVo runtime = buildRuntime();
        vo.setNode(runtime);
        vo.setJvm(runtime);
        vo.setSysFiles(buildDisks());
        return vo;
    }

    private ServerVo.CpuVo buildCpu(com.sun.management.OperatingSystemMXBean osBean) {
        ServerVo.CpuVo cpu = new ServerVo.CpuVo();
        cpu.setCpuNum(Runtime.getRuntime().availableProcessors());

        double cpuLoad = osBean.getCpuLoad();
        double used = cpuLoad < 0 ? 0 : cpuLoad * 100;
        double processLoad = osBean.getProcessCpuLoad();
        double user = processLoad < 0 ? 0 : processLoad * 100;

        cpu.setUsed(round2(used));
        cpu.setUser(round2(Math.min(user, used)));
        cpu.setSys(round2(Math.max(0, used - user)));

        String model = System.getenv("PROCESSOR_IDENTIFIER");
        cpu.setModel(model == null || model.isBlank() ? osBean.getName() : model);
        // JDK 没有直接提供主频，保留 0 与 Nest 端字段兼容
        cpu.setSpeed(0);
        return cpu;
    }

    private ServerVo.MemVo buildMem(com.sun.management.OperatingSystemMXBean osBean) {
        ServerVo.MemVo mem = new ServerVo.MemVo();
        long total = osBean.getTotalMemorySize();
        long free = osBean.getFreeMemorySize();
        long used = Math.max(0, total - free);

        mem.setTotal(round2(total / BYTES_PER_GB));
        mem.setUsed(round2(used / BYTES_PER_GB));
        mem.setFree(round2(free / BYTES_PER_GB));
        mem.setUsage(total <= 0 ? 0 : round2(used * 100.0 / total));
        return mem;
    }

    private ServerVo.SysVo buildSys() {
        ServerVo.SysVo sys = new ServerVo.SysVo();
        sys.setComputerName(resolveHostName());
        sys.setComputerIp(resolveHostIp());
        sys.setOsName(System.getProperty("os.name") + " " + System.getProperty("os.version"));
        sys.setOsArch(System.getProperty("os.arch"));
        sys.setUserDir(System.getProperty("user.dir"));
        sys.setSysTime(LocalDateTime.now().format(TIME_FORMATTER));

        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        sys.setUptime(runtimeMXBean.getUptime() / 1000);
        return sys;
    }

    private ServerVo.RuntimeVo buildRuntime() {
        ServerVo.RuntimeVo runtime = new ServerVo.RuntimeVo();
        Runtime jvm = Runtime.getRuntime();

        long max = jvm.maxMemory();
        long used = Math.max(0, jvm.totalMemory() - jvm.freeMemory());

        runtime.setNodeVersion(System.getProperty("java.version"));
        runtime.setNestVersion(SpringBootVersion.getVersion());
        runtime.setRunTime(ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        runtime.setHome(System.getProperty("java.home"));
        runtime.setTotalMemory(round2(max / BYTES_PER_GB));
        runtime.setUsedMemory(round2(used / BYTES_PER_GB));
        runtime.setFreeMemory(round2(Math.max(0, max - used) / BYTES_PER_GB));
        runtime.setMaxMemory(round2(max / BYTES_PER_GB));
        return runtime;
    }

    private List<ServerVo.DiskVo> buildDisks() {
        File[] roots = File.listRoots();
        if (roots == null) {
            return List.of();
        }
        List<ServerVo.DiskVo> disks = new ArrayList<>();
        for (File root : roots) {
            try {
                long total = root.getTotalSpace();
                if (total <= 0) {
                    continue;
                }
                long free = root.getUsableSpace();
                long used = Math.max(0, total - free);

                ServerVo.DiskVo disk = new ServerVo.DiskVo();
                disk.setDirName(root.getPath());
                disk.setSysTypeName("local");
                disk.setTypeName("固定磁盘");
                disk.setTotal(round2(total / BYTES_PER_GB));
                disk.setUsed(round2(used / BYTES_PER_GB));
                disk.setFree(round2(free / BYTES_PER_GB));
                disk.setUsage(round2(used * 100.0 / total));
                disks.add(disk);
            } catch (Exception e) {
                log.warn("读取磁盘信息失败：{}", e.getMessage());
            }
        }
        return disks;
    }

    private String resolveHostName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    /**
     * 取第一个非回环的 IPv4 地址
     */
    private String resolveHostIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces == null) {
                return "127.0.0.1";
            }
            for (NetworkInterface networkInterface : Collections.list(interfaces)) {
                if (!networkInterface.isUp() || networkInterface.isLoopback() || networkInterface.isVirtual()) {
                    continue;
                }
                for (InterfaceAddress address : networkInterface.getInterfaceAddresses()) {
                    InetAddress inetAddress = address.getAddress();
                    if (inetAddress instanceof Inet4Address
                            && !inetAddress.isLoopbackAddress()
                            && !inetAddress.isLinkLocalAddress()) {
                        return inetAddress.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("读取服务器 IP 失败：{}", e.getMessage());
        }
        return "127.0.0.1";
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
