package com.sysnest.admin.modules.menu.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 菜单返回结构
 */
@Data
public class MenuVo {

    private Integer id;
    private String menuName;
    private Integer parentId;
    private Integer orderNum;
    private String path;
    private String component;
    private String query;
    private String isFrame;
    private String isCache;
    private String visible;
    private String menuType;
    private String perms;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
