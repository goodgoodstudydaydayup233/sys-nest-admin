package com.sysnest.admin.modules.message.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 站内信，对应表 sys_message
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_message")
public class Message extends BaseEntity {

    /** 发送者用户名 */
    @TableField("senderName")
    private String senderName;

    /** 接收用户 ID */
    @TableField("receiverId")
    private Integer receiverId;

    /** 接收用户名 */
    @TableField("receiverName")
    private String receiverName;

    /** 标题 */
    private String title;

    /** 内容 */
    private String content;

    /** 类型：1-系统通知 2-业务提醒 3-任务结果 */
    private String type;

    /** 状态：0-未读 1-已读 */
    private String status;

    /** 读取时间 */
    @TableField("readAt")
    private LocalDateTime readAt;
}
