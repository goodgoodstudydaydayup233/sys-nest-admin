package com.sysnest.admin.modules.role.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色，对应表 sys_role
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_role")
public class Role extends BaseEntity {

    /** 角色名称 */
    private String name;

    /** 角色编码 */
    private String code;

    /** 排序 */
    private Integer sort;

    /** 备注 */
    private String remark;

    /** 状态：0禁用 1启用 */
    private String status;

    /** 权限标识，如 *:*:* */
    private String permission;
}
