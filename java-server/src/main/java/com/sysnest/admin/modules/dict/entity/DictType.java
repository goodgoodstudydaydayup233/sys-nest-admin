package com.sysnest.admin.modules.dict.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 字典类型，对应表 sys_dict_type
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_dict_type")
public class DictType extends BaseEntity {

    private String name;

    /** 字典类型编码，如 status */
    private String type;

    @TableField("group_id")
    private Integer groupId;

    private Integer sort;
    private String status;
    private String remark;
}
