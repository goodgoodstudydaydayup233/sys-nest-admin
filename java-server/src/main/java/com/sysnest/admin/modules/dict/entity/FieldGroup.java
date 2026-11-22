package com.sysnest.admin.modules.dict.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 字典字段分组，对应表 sys_field_group
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_field_group")
public class FieldGroup extends BaseEntity {

    private String name;
    private String code;
    private Integer sort;
    private String status;
    private String remark;
}
