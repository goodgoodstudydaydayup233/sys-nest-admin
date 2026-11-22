package com.sysnest.admin.modules.notice.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 通知公告查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class NoticeQuery extends PageQuery {

    private String noticeTitle;

    /** 创建者，对应数据库 createdBy */
    private String createBy;

    @Pattern(regexp = "^[12]$", message = "通知类型只能为 1-通知 或 2-公告")
    private String noticeType;
}
