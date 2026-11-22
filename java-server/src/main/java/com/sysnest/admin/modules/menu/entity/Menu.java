package com.sysnest.admin.modules.menu.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 菜单，对应表 sys_menu
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_menu")
public class Menu extends BaseEntity {

    /** 父菜单 ID，0 表示根 */
    @TableField("parentId")
    private Integer parentId;

    /** 路由地址 */
    private String path;

    /** 菜单名称 */
    @TableField("menuName")
    private String menuName;

    /** 排序 */
    @TableField("orderNum")
    private Integer orderNum;

    /** 路由参数 */
    private String query;

    /** 是否外链：0是 1否 */
    @TableField("isFrame")
    private String isFrame;

    /** 是否缓存：0缓存 1不缓存 */
    @TableField("isCache")
    private String isCache;

    /** 类型：M目录 C菜单 F按钮 */
    @TableField("menuType")
    private String menuType;

    /** 权限标识 */
    private String perms;

    /** 组件路径 */
    private String component;

    /** 图标 */
    private String icon;

    /** 是否显示：0显示 1隐藏 */
    private String visible;
}
