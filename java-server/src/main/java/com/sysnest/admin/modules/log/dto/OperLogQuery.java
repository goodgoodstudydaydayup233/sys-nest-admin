package com.sysnest.admin.modules.log.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 操作日志查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OperLogQuery extends PageQuery {

    private String title;

    private String operName;

    @Pattern(regexp = "^[0-9]$", message = "业务类型只能为 0-9")
    private String businessType;

    @Pattern(regexp = "^[01]$", message = "操作状态只能为 0-正常 或 1-异常")
    private String status;

    private String requestMethod;

    /** 开始时间，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String startTime;

    /** 结束时间，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String endTime;
}
