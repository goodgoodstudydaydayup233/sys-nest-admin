package com.sysnest.admin.modules.user.vo;

import com.sysnest.admin.modules.auth.vo.RoleSimpleVo;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户返回结构，不含密码等敏感字段
 */
@Data
public class UserVo {

    private Integer id;
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private String avatar;
    private String status;
    private String sex;
    private String remark;
    private List<RoleSimpleVo> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
