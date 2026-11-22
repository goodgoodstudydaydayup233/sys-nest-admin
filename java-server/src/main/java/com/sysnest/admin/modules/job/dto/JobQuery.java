package com.sysnest.admin.modules.job.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 定时任务查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class JobQuery extends PageQuery {

    private String jobName;

    private String jobGroup;

    @Pattern(regexp = "^[01]$", message = "状态只能为 0-正常 或 1-暂停")
    private String status;
}
