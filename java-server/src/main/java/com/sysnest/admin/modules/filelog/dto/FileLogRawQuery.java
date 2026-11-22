package com.sysnest.admin.modules.filelog.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 日志文件原始内容预览查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class FileLogRawQuery extends PageQuery {

    /** 日志文件名，如 access.log 或 access.2026-11-22.0.log */
    @NotBlank(message = "日志文件名不能为空")
    private String fileName;

    public FileLogRawQuery() {
        // 与 Nest 端原始内容预览的默认每页行数保持一致
        setPageSize(500);
    }
}
