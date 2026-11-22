package com.sysnest.admin.modules.online.dto;

import lombok.Data;

/**
 * 在线用户查询条件，与 Nest 的 QueryOnlineDto 一致
 */
@Data
public class OnlineQuery {

    /** 用户名（模糊匹配） */
    private String username;

    /** 登录 IP（模糊匹配） */
    private String ipaddr;
}
