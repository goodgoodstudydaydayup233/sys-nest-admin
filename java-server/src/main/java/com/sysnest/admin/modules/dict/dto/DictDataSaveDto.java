package com.sysnest.admin.modules.dict.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 字典数据新增/修改
 */
@Data
public class DictDataSaveDto {

    @Size(max = 100, message = "字典标签长度不能超过 100 个字符")
    private String label;

    @Size(max = 100, message = "字典值长度不能超过 100 个字符")
    private String value;

    private Integer typeId;

    @Size(max = 100, message = "CSS 类名长度不能超过 100 个字符")
    private String cssClass;

    @Size(max = 100, message = "列表样式长度不能超过 100 个字符")
    private String listClass;

    private Integer sort;
    private String status;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;
}
