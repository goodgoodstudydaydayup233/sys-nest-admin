package com.sysnest.admin.modules.message.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内信返回结构
 */
@Data
public class MessageVo {

    private Integer id;
    private String senderName;
    private Integer receiverId;
    private String receiverName;
    private String title;
    private String content;
    private String type;
    private String status;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
