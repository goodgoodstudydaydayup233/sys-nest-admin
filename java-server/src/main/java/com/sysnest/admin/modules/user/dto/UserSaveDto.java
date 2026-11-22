package com.sysnest.admin.modules.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增/修改用户，前端以 multipart/form-data 提交
 * 必填项在 Service 中按新增/修改场景判断，这里约束格式和长度
 */
@Data
public class UserSaveDto {

    @Size(max = 50, message = "用户名长度不能超过 50 个字符")
    private String username;

    /** 允许空串：新增时空串使用默认密码 */
    @Pattern(regexp = "^$|^.{6,100}$", message = "密码长度不能小于 6 位")
    private String password;

    @Size(max = 50, message = "昵称长度不能超过 50 个字符")
    private String nickname;

    @Pattern(regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "邮箱格式不正确")
    private String email;

    @Pattern(regexp = "^$|^((\\+|00)86)?(1[3-9]|9[28])\\d{9}$",
            message = "手机号格式不正确")
    private String phone;

    private String status;
    private String sex;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;
}
