package com.sysnest.admin.modules.menu.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 菜单新增/修改参数
 */
@Data
public class MenuSaveDto {

    @Min(value = 0, message = "父菜单 ID 不能小于 0")
    private Integer parentId;

    @Size(max = 200, message = "路由地址长度不能超过 200 个字符")
    private String path;

    @Size(max = 50, message = "菜单名称长度不能超过 50 个字符")
    private String menuName;

    @Min(value = 0, message = "排序不能小于 0")
    private Integer orderNum;

    @Size(max = 255, message = "路由参数长度不能超过 255 个字符")
    private String query;

    private String isFrame;
    private String isCache;
    private String menuType;

    @Size(max = 100, message = "权限标识长度不能超过 100 个字符")
    private String perms;

    @Size(max = 255, message = "组件路径长度不能超过 255 个字符")
    private String component;

    @Size(max = 100, message = "图标长度不能超过 100 个字符")
    private String icon;

    private String visible;

    /** 仅用于接收前端可能多传的字段，不参与保存 */
    private List<Integer> children;
}
