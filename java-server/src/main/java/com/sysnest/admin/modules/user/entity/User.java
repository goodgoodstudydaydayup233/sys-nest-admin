package com.sysnest.admin.modules.user.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户，对应表 sys_user
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class User extends BaseEntity {

    /** 登录账号 */
    private String username;

    /** BCrypt 密文 */
    private String password;

    /** 昵称 */
    private String nickname;

    /** 邮箱 */
    private String email;

    /** 手机号 */
    private String phone;

    /** 头像地址 */
    private String avatar;

    /** 备注 */
    private String remark;

    /** 状态：0禁用 1启用 */
    private String status;

    /** 性别：0男 1女 3未知 */
    private String sex;
}
