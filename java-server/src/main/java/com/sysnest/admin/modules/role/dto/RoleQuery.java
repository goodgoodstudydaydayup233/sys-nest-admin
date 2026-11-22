package com.sysnest.admin.modules.role.dto;

import com.sysnest.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色列表查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class RoleQuery extends PageQuery {

    private String name;
    private String status;
}
