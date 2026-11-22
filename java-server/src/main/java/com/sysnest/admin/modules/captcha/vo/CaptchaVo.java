package com.sysnest.admin.modules.captcha.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 验证码返回：key 用于登录时回传，image 是完整 SVG 字符串
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaVo {

    private String key;
    private String image;
}
