package com.sysnest.admin.modules.menu.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 路由菜单元信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetaVo {

    /** 菜单名称 */
    private String title;

    /** 图标 */
    private String icon;

    /** 是否不缓存（isCache = '1'） */
    private Boolean noCache;

    /** 外链地址 */
    private String link;

    /** 外链原始路径 */
    private String path;
}
