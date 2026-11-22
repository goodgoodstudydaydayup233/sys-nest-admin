package com.sysnest.admin.modules.menu.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.List;

/**
 * 菜单树节点，叶子节点的 children 也是空数组（不是 null）
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class MenuTreeVo extends MenuVo {

    private List<MenuTreeVo> children = new ArrayList<>();
}
