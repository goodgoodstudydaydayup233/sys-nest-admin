package com.sysnest.admin.modules.filelog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.config.properties.AppProperties;
import com.sysnest.admin.modules.filelog.dto.FileLogEntriesQuery;
import com.sysnest.admin.modules.filelog.dto.FileLogFilesQuery;
import com.sysnest.admin.modules.filelog.dto.FileLogRawQuery;
import com.sysnest.admin.modules.filelog.vo.FileLogEntriesVo;
import com.sysnest.admin.modules.filelog.vo.FileLogEntryVo;
import com.sysnest.admin.modules.filelog.vo.FileLogFileVo;
import com.sysnest.admin.modules.filelog.vo.FileLogFilesVo;
import com.sysnest.admin.modules.filelog.vo.FileLogRawVo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * 文件日志查询服务，对应 Nest 的 file-log.service.ts
 *
 * Java 端日志由 logback 写入，格式为：
 * 2026-11-22 15:00:00.123 INFO  [http-nio-3100-exec-1] c.s.a... - 日志内容
 *
 * 访问日志的“日志内容”是 JSON，可解析出 method/url/status/ip/user/cost/ua。
 * 文件名兼容两种：
 * - Java logback：access.log、access.2026-11-22.0.log
 * - Nest 端：access-20261122-0001.log
 */
@Slf4j
@Service
public class FileLogService {

    /** 日志分类合法值 */
    private static final String[] CATEGORIES = {"access", "app", "error"};

    /** 文件名白名单，同时兼容 Java logback 与 Nest 端命名 */
    private static final Pattern FILE_NAME_PATTERN =
            Pattern.compile("^(access|app|error)(?:\\.log|\\.\\d{4}-\\d{2}-\\d{2}\\.\\d+\\.log|-\\d{8}-\\d{4}\\.log)$");

    /** logback 每行格式 */
    private static final Pattern LOG_LINE_PATTERN = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+"
                    + "(TRACE|DEBUG|INFO|WARN|ERROR)\\s+\\[([^\\]]*)]\\s+(\\S+)\\s+-\\s?(.*)$");

    /** 内容查询最多扫描的文件数（从新到旧） */
    private static final int MAX_FILES_SCAN = 20;
    /** 内容查询最多扫描的总行数 */
    private static final int MAX_LINES_SCAN = 200_000;
    /** 原始内容预览最多读取的总行数 */
    private static final int MAX_RAW_LINES = 500_000;

    private static final DateTimeFormatter MTIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final Path baseDir;
    private final ObjectMapper objectMapper;

    public FileLogService(AppProperties appProperties, ObjectMapper objectMapper) {
        this.baseDir = Paths.get(appProperties.getFileLog().getDir()).toAbsolutePath().normalize();
        this.objectMapper = objectMapper;
    }

    // ==================== 文件列表 ====================

    public FileLogFilesVo listFiles(FileLogFilesQuery query) {
        String category = normalizeCategory(query.getCategory());
        List<FileInfo> files = scanFiles(category);

        long totalSize = files.stream().mapToLong(FileInfo::size).sum();
        long page = Math.max(1, query.getPage());
        long pageSize = Math.max(1, query.getPageSize());
        int from = (int) Math.min((page - 1) * pageSize, files.size());
        int to = (int) Math.min(from + pageSize, files.size());

        List<FileLogFileVo> list = files.subList(from, to).stream()
                .map(file -> toFileVo(file, category))
                .toList();

        FileLogFilesVo vo = new FileLogFilesVo();
        vo.setList(list);
        vo.setTotal(files.size());
        vo.setPage(page);
        vo.setPageSize(pageSize);
        vo.setTotalSize(totalSize);
        vo.setTotalSizeText(formatSize(totalSize));
        vo.setTotalFiles(files.size());
        return vo;
    }

    // ==================== 日志内容 ====================

    public FileLogEntriesVo readEntries(FileLogEntriesQuery query) {
        String category = normalizeCategory(query.getCategory());

        List<String> fileNames;
        if (StringUtils.hasText(query.getFileName())) {
            assertValidFileName(query.getFileName(), category);
            fileNames = List.of(query.getFileName());
        } else {
            fileNames = scanFiles(category).stream()
                    .limit(MAX_FILES_SCAN)
                    .map(FileInfo::name)
                    .toList();
        }

        List<FileLogEntryVo> entries = new ArrayList<>();
        int scannedLines = 0;
        boolean truncated = false;

        for (String fileName : fileNames) {
            if (scannedLines >= MAX_LINES_SCAN) {
                truncated = true;
                break;
            }
            ScanResult result = scanFile(category, fileName, query, entries, MAX_LINES_SCAN - scannedLines);
            scannedLines += result.scannedLines();
            if (result.truncated()) {
                truncated = true;
                break;
            }
        }

        // 按时间从新到旧
        entries.sort(Comparator.comparing(FileLogEntryVo::getTs,
                Comparator.nullsLast(Comparator.<String>reverseOrder())));

        long page = Math.max(1, query.getPage());
        long pageSize = Math.max(1, query.getPageSize());
        int from = (int) Math.min((page - 1) * pageSize, entries.size());
        int to = (int) Math.min(from + pageSize, entries.size());

        FileLogEntriesVo vo = new FileLogEntriesVo();
        vo.setList(entries.subList(from, to));
        vo.setTotal(entries.size());
        vo.setPage(page);
        vo.setPageSize(pageSize);
        vo.setTruncated(truncated);
        return vo;
    }

    /**
     * 按行分页读取原始文本（在线预览用）
     */
    public FileLogRawVo readRaw(FileLogRawQuery query) {
        Path path = resolveFilePath(query.getFileName());
        if (!Files.isRegularFile(path)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "日志文件不存在: " + query.getFileName());
        }

        long page = Math.max(1, query.getPage());
        long pageSize = Math.max(1, query.getPageSize());
        long start = (page - 1) * pageSize;
        long end = start + pageSize;

        List<String> content = new ArrayList<>();
        long total = 0;
        boolean truncated = false;

        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (total >= MAX_RAW_LINES) {
                    truncated = true;
                    break;
                }
                total++;
                if (total > start && total <= end) {
                    content.add(line);
                }
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "读取日志文件失败: " + e.getMessage());
        }

        FileLogRawVo vo = new FileLogRawVo();
        vo.setContent(content);
        vo.setTotal(total);
        vo.setPage(page);
        vo.setPageSize(pageSize);
        vo.setTruncated(truncated);
        return vo;
    }

    public void removeFile(String name) {
        Path path = resolveFilePath(name);
        try {
            if (!Files.deleteIfExists(path)) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "日志文件不存在: " + name);
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "删除日志文件失败: " + e.getMessage());
        }
    }

    /**
     * 校验并解析日志文件绝对路径（下载接口也用）
     */
    public Path resolveFilePath(String name) {
        assertValidFileName(name);
        String category = categoryOf(name);
        Path dir = baseDir.resolve(category).normalize();
        Path path = dir.resolve(name).normalize();
        // 二次防护：必须位于日志根目录内，杜绝路径穿越
        if (!path.startsWith(dir) || !path.startsWith(baseDir)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "非法的日志文件名: " + name);
        }
        return path;
    }

    // ==================== 内部工具 ====================

    private List<FileInfo> scanFiles(String category) {
        Path dir = baseDir.resolve(category);
        if (!Files.isDirectory(dir)) {
            return List.of();
        }
        try (Stream<Path> stream = Files.list(dir)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> isValidFileName(path.getFileName().toString(), category))
                    .map(this::toFileInfo)
                    .filter(file -> file != null)
                    .sorted(Comparator.comparingLong(FileInfo::mtime).reversed()
                            .thenComparing(FileInfo::name, Comparator.reverseOrder()))
                    .toList();
        } catch (IOException e) {
            log.warn("读取日志目录失败：{}", e.getMessage());
            return List.of();
        }
    }

    private FileInfo toFileInfo(Path path) {
        try {
            return new FileInfo(path.getFileName().toString(),
                    Files.size(path),
                    Files.getLastModifiedTime(path).toMillis());
        } catch (IOException e) {
            return null;
        }
    }

    private FileLogFileVo toFileVo(FileInfo file, String category) {
        FileLogFileVo vo = new FileLogFileVo();
        vo.setName(file.name());
        vo.setCategory(category);
        vo.setSize(file.size());
        vo.setSizeText(formatSize(file.size()));
        vo.setMtime(LocalDateTime.ofInstant(Instant.ofEpochMilli(file.mtime()), ZoneId.systemDefault())
                .format(MTIME_FORMATTER));
        return vo;
    }

    /**
     * 扫描单个文件：统计行数、解析并筛选日志。堆栈行会追加到上一条日志的 stack。
     */
    private ScanResult scanFile(String category, String fileName, FileLogEntriesQuery query,
                                List<FileLogEntryVo> output, int maxLines) {
        Path path = baseDir.resolve(category).resolve(fileName);
        if (!Files.isRegularFile(path)) {
            return new ScanResult(0, false);
        }

        int scannedLines = 0;
        boolean truncated = false;
        FileLogEntryVo previous = null;

        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (scannedLines >= maxLines) {
                    truncated = true;
                    break;
                }
                scannedLines++;

                FileLogEntryVo entry = parseLine(line, category);
                if (entry == null) {
                    // 异常堆栈等续行，挂到上一条日志上
                    if (previous != null && !line.isBlank()) {
                        previous.setStack(previous.getStack() == null
                                ? line
                                : previous.getStack() + "\n" + line);
                    }
                    continue;
                }

                previous = entry;
                if (matchFilters(entry, query)) {
                    output.add(entry);
                }
            }
        } catch (IOException e) {
            log.warn("读取日志文件[{}]失败：{}", fileName, e.getMessage());
        }

        return new ScanResult(scannedLines, truncated);
    }

    private FileLogEntryVo parseLine(String line, String category) {
        Matcher matcher = LOG_LINE_PATTERN.matcher(line);
        if (!matcher.matches()) {
            return null;
        }

        FileLogEntryVo entry = new FileLogEntryVo();
        entry.setTs(matcher.group(1));
        entry.setLevel(matcher.group(2));
        entry.setCategory(category);
        entry.setContext(matcher.group(3));

        String message = matcher.group(5);
        if ("access".equals(category)) {
            parseAccessMessage(entry, message);
        } else {
            entry.setMessage(message);
        }
        return entry;
    }

    /**
     * 访问日志的 message 是 AccessLogFilter 输出的 JSON
     */
    private void parseAccessMessage(FileLogEntryVo entry, String message) {
        entry.setMessage(message);
        String trimmed = message == null ? "" : message.trim();
        if (!trimmed.startsWith("{")) {
            return;
        }
        try {
            JsonNode node = objectMapper.readTree(trimmed);
            entry.setMethod(textValue(node, "method"));
            entry.setUrl(textValue(node, "url"));
            entry.setIp(textValue(node, "ip"));
            entry.setUser(textValue(node, "user"));
            entry.setUa(textValue(node, "ua"));
            if (node.hasNonNull("status")) {
                entry.setStatus(node.get("status").asInt());
            }
            if (node.hasNonNull("cost")) {
                entry.setCost(node.get("cost").asInt());
            }
            if (entry.getMethod() != null && entry.getUrl() != null && entry.getStatus() != null) {
                entry.setMessage(entry.getMethod() + " " + entry.getUrl() + " " + entry.getStatus());
            }
        } catch (Exception e) {
            // 不是合法 JSON 就保留原文
        }
    }

    private String textValue(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private boolean matchFilters(FileLogEntryVo entry, FileLogEntriesQuery query) {
        if (StringUtils.hasText(query.getLevel())
                && !query.getLevel().equalsIgnoreCase(entry.getLevel())) {
            return false;
        }
        if (StringUtils.hasText(query.getStartTime()) && entry.getTs() != null
                && entry.getTs().compareTo(query.getStartTime()) < 0) {
            return false;
        }
        if (StringUtils.hasText(query.getEndTime()) && entry.getTs() != null
                && entry.getTs().compareTo(query.getEndTime()) > 0) {
            return false;
        }
        if (StringUtils.hasText(query.getKeyword())) {
            String haystack = String.join(" ",
                            nullSafe(entry.getMessage()), nullSafe(entry.getContext()),
                            nullSafe(entry.getMethod()), nullSafe(entry.getUrl()),
                            nullSafe(entry.getIp()), nullSafe(entry.getUser()),
                            nullSafe(entry.getStack()))
                    .toLowerCase();
            if (!haystack.contains(query.getKeyword().toLowerCase())) {
                return false;
            }
        }
        return true;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String normalizeCategory(String category) {
        if (!StringUtils.hasText(category)) {
            return "access";
        }
        for (String valid : CATEGORIES) {
            if (valid.equals(category)) {
                return valid;
            }
        }
        throw new BusinessException(ErrorCode.BAD_REQUEST, "日志分类只能为 access/app/error");
    }

    private boolean isValidFileName(String name, String category) {
        return FILE_NAME_PATTERN.matcher(name).matches() && categoryOf(name).equals(category);
    }

    private void assertValidFileName(String name) {
        if (!StringUtils.hasText(name) || !FILE_NAME_PATTERN.matcher(name).matches()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "非法的日志文件名: " + name);
        }
    }

    private void assertValidFileName(String name, String category) {
        assertValidFileName(name);
        if (!categoryOf(name).equals(category)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "非法的日志文件名: " + name);
        }
    }

    private String categoryOf(String name) {
        if (name.startsWith("access")) {
            return "access";
        }
        if (name.startsWith("app")) {
            return "app";
        }
        return "error";
    }

    /** 字节数人性化展示 */
    private String formatSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return String.format("%.2f KB", bytes / 1024.0);
        }
        if (bytes < 1024L * 1024 * 1024) {
            return String.format("%.2f MB", bytes / (1024.0 * 1024));
        }
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    private record FileInfo(String name, long size, long mtime) {
    }

    private record ScanResult(int scannedLines, boolean truncated) {
    }
}
