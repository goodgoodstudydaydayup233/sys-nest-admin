package com.sysnest.admin.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 启用/禁用状态，对应数据库 disabled 字段：0-启用 1-禁用
 */
@Getter
@AllArgsConstructor
public enum StatusEnum {

    ENABLE("0", "启用"),
    DISABLE("1", "禁用");

    private final String code;
    private final String desc;
}
