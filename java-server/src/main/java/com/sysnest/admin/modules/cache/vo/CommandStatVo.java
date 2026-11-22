package com.sysnest.admin.modules.cache.vo;

import lombok.Data;

/**
 * 命令执行统计项，用于缓存监控饼图
 */
@Data
public class CommandStatVo {

    private String name;
    private String value;
}
