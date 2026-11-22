package com.sysnest.admin.modules.notice.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知公告返回结构
 */
@Data
public class NoticeVo {

    private Integer id;
    private String noticeTitle;
    private String noticeType;
    private String noticeContent;
    private String status;

    /** 前端字段叫 createBy，对应数据库 createdBy */
    private String createBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
