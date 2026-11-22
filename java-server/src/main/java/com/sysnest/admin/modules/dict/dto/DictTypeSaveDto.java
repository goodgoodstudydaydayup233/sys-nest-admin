package com.sysnest.admin.modules.dict.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 字典类型新增/修改
 */
@Data
public class DictTypeSaveDto {

    @Size(max = 100, message = "字典名称长度不能超过 100 个字符")
    private String name;

    @Size(max = 100, message = "字典类型长度不能超过 100 个字符")
    private String type;

    private Integer groupId;
    private Integer sort;
    private String status;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;
}
