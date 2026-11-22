package com.sysnest.admin.modules.auth.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 用户简要角色信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleSimpleVo implements Serializable {

    private Integer id;
    private String name;
}
