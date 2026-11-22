package com.sysnest.admin.modules.filelog.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 日志文件列表查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class FileLogFilesQuery extends PageQuery {

    /** 日志分类：access-访问日志 app-应用日志 error-错误日志 */
    @Pattern(regexp = "^(access|app|error)$", message = "日志分类只能为 access/app/error")
    private String category = "access";
}
