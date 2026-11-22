package com.sysnest.admin.modules.role.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 角色新增/修改参数
 */
@Data
public class RoleSaveDto {

    @Size(max = 50, message = "角色名称长度不能超过 50 个字符")
    private String name;

    @Size(max = 50, message = "角色编码长度不能超过 50 个字符")
    private String code;

    @Size(max = 100, message = "权限标识长度不能超过 100 个字符")
    private String permission;

    private String status;
    private Integer sort;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;

    /** 绑定的菜单 ID；null 表示不修改，空数组表示清空 */
    private List<Integer> menuIds;
}
