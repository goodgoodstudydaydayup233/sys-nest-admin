package com.sysnest.admin.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 登录请求参数
 */
@Data
public class LoginDto {

    @NotBlank(message = "用户名不能为空")
    @Size(max = 50, message = "用户名长度不能超过 50 个字符")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(max = 100, message = "密码长度不能超过 100 个字符")
    private String password;

    /** 验证码文本，验证码关闭时可不传 */
    private String captcha;

    /** 验证码 key */
    private String captchaKey;
}
