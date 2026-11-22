package com.sysnest.admin.modules.auth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 当前用户信息，字段与 Nest 的 userInfo 返回一致
 * 会整体缓存到 Redis，所以必须可序列化且有默认构造器
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoVo implements Serializable {

    private Integer id;
    private String username;
    private String nickname;
    private String avatar;

    /** 角色列表，前端需要 id + name */
    private List<RoleSimpleVo> roles;

    /** 权限点集合，如 system:user:list */
    private Set<String> permissions = new LinkedHashSet<>();
}
