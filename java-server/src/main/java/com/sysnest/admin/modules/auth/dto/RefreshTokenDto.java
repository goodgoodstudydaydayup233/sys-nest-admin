package com.sysnest.admin.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 刷新 Token 请求参数
 */
@Data
public class RefreshTokenDto {

    @NotBlank(message = "refreshToken 不能为空")
    private String refreshToken;
}
