package com.sysnest.admin.modules.job.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 定时任务调度日志，对应表 sys_job_log
 * 日志直接物理删除/清空，没有软删除字段，因此不继承 BaseEntity
 */
@Data
@TableName("sys_job_log")
public class SysJobLog {

    /** 日志 ID */
    @TableId(value = "jobLogId", type = IdType.AUTO)
    private Integer jobLogId;

    /** 任务名称 */
    @TableField("jobName")
    private String jobName;

    /** 任务组名 */
    @TableField("jobGroup")
    private String jobGroup;

    /** 调用目标字符串 */
    @TableField("invokeTarget")
    private String invokeTarget;

    /** 日志信息 */
    @TableField("jobMessage")
    private String jobMessage;

    /** 执行状态：0-成功 1-失败 */
    private String status;

    /** 异常信息 */
    @TableField("exceptionInfo")
    private String exceptionInfo;

    /** 执行时间 */
    @TableField("createTime")
    private LocalDateTime createTime;
}
