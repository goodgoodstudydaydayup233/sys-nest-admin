package com.sysnest.admin.modules.job.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 调度日志返回结构，字段名与 Nest 端 JobLogVo 一致
 */
@Data
public class JobLogVo {

    private Integer jobLogId;
    private String jobName;
    private String jobGroup;
    private String invokeTarget;
    private String jobMessage;
    private String status;
    private String exceptionInfo;
    private LocalDateTime createTime;
}
