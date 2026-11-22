package com.sysnest.admin.modules.job.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 定时任务新增/修改参数
 * 新增时必填项（任务名、调用目标、cron）由 Service 校验，和 Nest 端保持一致
 */
@Data
public class JobSaveDto {

    @Size(max = 64, message = "任务名称长度不能超过 64 个字符")
    private String jobName;

    @Size(max = 64, message = "任务组名长度不能超过 64 个字符")
    private String jobGroup;

    @Size(max = 500, message = "调用目标字符串长度不能超过 500 个字符")
    private String invokeTarget;

    @Size(max = 255, message = "cron 表达式长度不能超过 255 个字符")
    private String cronExpression;

    @Pattern(regexp = "^[123]$", message = "执行策略只能为 1/2/3")
    private String misfirePolicy;

    @Pattern(regexp = "^[01]$", message = "是否并发只能为 0/1")
    private String concurrent;

    @Pattern(regexp = "^[01]$", message = "状态只能为 0-正常 或 1-暂停")
    private String status;

    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
