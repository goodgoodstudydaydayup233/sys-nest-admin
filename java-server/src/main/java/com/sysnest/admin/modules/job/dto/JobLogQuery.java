package com.sysnest.admin.modules.job.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 调度日志查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class JobLogQuery extends PageQuery {

    private String jobName;

    private String jobGroup;

    @Pattern(regexp = "^[01]$", message = "执行状态只能为 0-成功 或 1-失败")
    private String status;

    /** 开始日期，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String beginTime;

    /** 结束日期，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String endTime;
}
