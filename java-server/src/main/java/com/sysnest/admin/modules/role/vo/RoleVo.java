package com.sysnest.admin.modules.role.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 角色返回结构
 */
@Data
public class RoleVo {

    private Integer id;
    private String name;
    private String code;
    private String permission;
    private String status;
    private Integer sort;
    private String remark;
    private List<MenuSimpleVo> menus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
