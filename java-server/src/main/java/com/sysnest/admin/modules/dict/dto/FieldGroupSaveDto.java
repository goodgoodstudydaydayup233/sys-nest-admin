package com.sysnest.admin.modules.dict.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 字段分组新增/修改
 */
@Data
public class FieldGroupSaveDto {

    @Size(max = 100, message = "分组名称长度不能超过 100 个字符")
    private String name;

    @Size(max = 100, message = "分组编码长度不能超过 100 个字符")
    private String code;

    private Integer sort;
    private String status;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;
}
