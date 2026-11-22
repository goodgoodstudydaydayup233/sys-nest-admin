package com.sysnest.admin.modules.job.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 定时任务返回结构，字段名与 Nest 端 JobVo 一致
 */
@Data
public class JobVo {

    private Integer jobId;
    private String jobName;
    private String jobGroup;
    private String invokeTarget;
    private String cronExpression;
    private String misfirePolicy;
    private String concurrent;
    private String status;
    private LocalDateTime nextValidTime;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
