package com.sysnest.admin.modules.user.dto;

import com.sysnest.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户列表查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {

    private String username;
    private String nickname;
    private String phone;
    private String status;
}
