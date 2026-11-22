package com.sysnest.admin.modules.filelog.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 日志内容查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class FileLogEntriesQuery extends PageQuery {

    /** 日志分类：access-访问日志 app-应用日志 error-错误日志 */
    @Pattern(regexp = "^(access|app|error)$", message = "日志分类只能为 access/app/error")
    private String category = "access";

    /** 日志级别（精确匹配） */
    @Pattern(regexp = "^(DEBUG|INFO|WARN|ERROR|VERBOSE)$", message = "日志级别只能为 DEBUG/INFO/WARN/ERROR/VERBOSE")
    private String level;

    /** 关键字，匹配内容/上下文/路径/IP/操作人/堆栈 */
    private String keyword;

    /** 开始时间，格式 yyyy-MM-dd HH:mm:ss */
    private String startTime;

    /** 结束时间，格式 yyyy-MM-dd HH:mm:ss */
    private String endTime;

    /** 指定日志文件名，精确查看单个文件时使用 */
    private String fileName;

    public FileLogEntriesQuery() {
        // 与 Nest 端日志内容查询的默认每页条数保持一致
        setPageSize(20);
    }
}
