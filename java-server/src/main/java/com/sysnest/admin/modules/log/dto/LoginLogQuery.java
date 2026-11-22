package com.sysnest.admin.modules.log.dto;

import com.sysnest.admin.common.api.PageQuery;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 登录日志查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class LoginLogQuery extends PageQuery {

    private String userName;

    private String ipaddr;

    @Pattern(regexp = "^[01]$", message = "登录状态只能为 0-成功 或 1-失败")
    private String status;

    /** 开始时间，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String startTime;

    /** 结束时间，支持 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
    private String endTime;
}
