package com.sysnest.admin.modules.online.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 在线用户缓存对象，存入 Redis 的 online:token:{token}
 * loginTime 用字符串存，避免 Redis JSON 序列化对 LocalDateTime 的额外配置
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineUser implements Serializable {

    /** 完整 Access Token */
    private String tokenId;

    private Integer userId;
    private String username;
    private String nickname;
    private String ipaddr;
    private String browser;
    private String os;
    private String loginTime;
}
