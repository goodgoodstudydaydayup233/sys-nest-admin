package com.sysnest.admin.modules.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改个人信息，multipart 提交，可同时上传头像
 */
@Data
public class ProfileDto {

    @Size(max = 50, message = "昵称长度不能超过 50 个字符")
    private String nickname;

    @Pattern(regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "邮箱格式不正确")
    private String email;

    @Pattern(regexp = "^$|^((\\+|00)86)?(1[3-9]|9[28])\\d{9}$",
            message = "手机号格式不正确")
    private String phone;

    private String sex;

    @Size(max = 255, message = "头像地址长度不能超过 255 个字符")
    private String avatar;
}
