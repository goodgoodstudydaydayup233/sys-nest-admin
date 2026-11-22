package com.sysnest.admin.modules.job.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 修改任务状态参数：{ "jobId": 1, "status": "0" }
 */
@Data
public class JobStatusDto {

    @NotNull(message = "任务ID不能为空")
    private Integer jobId;

    @NotNull(message = "状态不能为空")
    @Pattern(regexp = "^[01]$", message = "状态只能为 0-正常 或 1-暂停")
    private String status;
}
