package com.sysnest.admin.modules.role.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 角色详情里的菜单简要信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuSimpleVo {

    private Integer id;
    private String menuName;
    private String perms;
}
