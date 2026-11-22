package com.sysnest.admin.modules.log.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 登录日志返回结构，字段与 Nest 端 LoginLogVo 一致
 */
@Data
public class LoginLogVo {

    private Integer id;
    private String userName;
    private String ipaddr;
    private String loginLocation;
    private String browser;
    private String os;
    private String status;
    private String msg;
    private LocalDateTime loginTime;
}
