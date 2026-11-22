package com.sysnest.admin.modules.dict.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 字典数据，对应表 sys_dict_data
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_dict_data")
public class DictData extends BaseEntity {

    private String label;
    private String value;

    @TableField("type_id")
    private Integer typeId;

    @TableField("cssClass")
    private String cssClass;

    @TableField("listClass")
    private String listClass;

    private Integer sort;
    private String status;
    private String remark;
}
