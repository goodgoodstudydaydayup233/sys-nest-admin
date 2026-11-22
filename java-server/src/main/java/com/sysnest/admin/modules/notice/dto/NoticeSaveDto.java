package com.sysnest.admin.modules.notice.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 通知公告新增/修改参数
 */
@Data
public class NoticeSaveDto {

    @Size(max = 50, message = "通知标题长度不能超过 50 个字符")
    private String noticeTitle;

    @Pattern(regexp = "^[12]$", message = "通知类型只能为 1-通知 或 2-公告")
    private String noticeType;

    private String noticeContent;

    @Pattern(regexp = "^[01]$", message = "状态只能为 0-正常 或 1-关闭")
    private String status;
}
