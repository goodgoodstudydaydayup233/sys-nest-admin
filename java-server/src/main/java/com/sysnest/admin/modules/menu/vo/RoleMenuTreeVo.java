package com.sysnest.admin.modules.menu.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 角色菜单树回显：menus 是完整菜单树，checkedKeys 是角色已选菜单 ID
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleMenuTreeVo {

    private List<MenuTreeVo> menus;
    private List<Integer> checkedKeys;
}
