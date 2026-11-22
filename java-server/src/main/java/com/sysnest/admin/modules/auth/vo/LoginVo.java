package com.sysnest.admin.modules.auth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录/刷新成功返回的双 Token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginVo {

    private String accessToken;
    private String refreshToken;
}
