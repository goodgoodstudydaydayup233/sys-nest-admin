package com.sysnest.admin.modules.job.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 立即执行任务参数：{ "jobId": 1 }
 */
@Data
public class JobRunDto {

    @NotNull(message = "任务ID不能为空")
    private Integer jobId;
}
