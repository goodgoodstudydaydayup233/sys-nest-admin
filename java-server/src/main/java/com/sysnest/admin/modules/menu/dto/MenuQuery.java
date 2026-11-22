package com.sysnest.admin.modules.menu.dto;

import lombok.Data;

/**
 * 菜单列表查询条件
 */
@Data
public class MenuQuery {

    private String menuName;
    private String visible;
}
