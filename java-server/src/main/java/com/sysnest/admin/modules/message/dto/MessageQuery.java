package com.sysnest.admin.modules.message.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 收件箱查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class MessageQuery extends PageQuery {

    @Pattern(regexp = "^[123]$", message = "消息类型仅支持 1-系统通知 / 2-业务提醒 / 3-任务结果")
    private String type;

    @Pattern(regexp = "^[01]$", message = "状态仅支持 0-未读 / 1-已读")
    private String status;

    private String keyword;

    /** 格式：yyyy-MM-dd HH:mm:ss */
    private String beginTime;
    private String endTime;
}
