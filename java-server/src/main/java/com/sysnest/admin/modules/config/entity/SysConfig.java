package com.sysnest.admin.modules.config.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 参数配置，对应表 sys_config
 * 注意：group 是 SQL 关键字，加反引号转义
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_config")
public class SysConfig extends BaseEntity {

    /** 参数键名 */
    @TableField("configKey")
    private String configKey;

    /** 参数值 */
    @TableField("configValue")
    private String configValue;

    /** 参数名称 */
    private String name;

    /** 分组 */
    @TableField("`group`")
    private String groupName;

    /** 备注 */
    private String remark;
}
