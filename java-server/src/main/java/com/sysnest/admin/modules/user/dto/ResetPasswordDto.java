package com.sysnest.admin.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 重置密码（管理员操作，不需要旧密码）
 */
@Data
public class ResetPasswordDto {

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, message = "新密码长度不能小于 6 位")
    private String newPassword;
}
