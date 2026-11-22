package com.sysnest.admin.modules.menu.vo;

import lombok.Data;

import java.util.List;

/**
 * 前端动态路由节点，字段与 Nest 的 getRouters 返回一致
 */
@Data
public class RouterVo {

    /** 是否隐藏 */
    private Boolean hidden;

    /** 路由名称：通常取 path 首字母大写 */
    private String name;

    /** 路由路径 */
    private String path;

    /** 组件：Layout / ParentView / InnerLink / 业务组件路径 */
    private String component;

    /** 路由参数 */
    private String query;

    /** 菜单元信息 */
    private MetaVo meta;

    /** 是否总是显示父级 */
    private Boolean alwaysShow;

    /** 重定向 */
    private String redirect;

    /** 子路由 */
    private List<RouterVo> children;
}
