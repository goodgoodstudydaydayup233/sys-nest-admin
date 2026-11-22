package com.sysnest.admin.modules.job.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 定时任务，对应表 sys_job
 * 字段与 Nest 端 sys-job.entity.ts 一致
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_job")
public class SysJob extends BaseEntity {

    /** 任务名称 */
    @TableField("jobName")
    private String jobName;

    /** 任务组名 */
    @TableField("jobGroup")
    private String jobGroup;

    /** 调用目标字符串，如 stTask.stParams('st') */
    @TableField("invokeTarget")
    private String invokeTarget;

    /** cron 执行表达式 */
    @TableField("cronExpression")
    private String cronExpression;

    /** 计划执行错误策略：1-立即执行 2-执行一次 3-放弃执行 */
    @TableField("misfirePolicy")
    private String misfirePolicy;

    /** 是否并发执行：0-允许 1-禁止 */
    private String concurrent;

    /** 状态：0-正常 1-暂停 */
    private String status;

    /** 下次执行时间；暂停时需要能更新成 null，所以用 ALWAYS 策略 */
    @TableField(value = "nextValidTime", updateStrategy = FieldStrategy.ALWAYS)
    private LocalDateTime nextValidTime;

    /** 备注 */
    private String remark;
}
