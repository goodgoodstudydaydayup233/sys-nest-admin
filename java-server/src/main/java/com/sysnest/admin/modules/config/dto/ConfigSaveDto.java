package com.sysnest.admin.modules.config.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 参数配置新增/修改
 */
@Data
public class ConfigSaveDto {

    @Size(max = 100, message = "配置键长度不能超过 100 个字符")
    private String configKey;

    @Size(max = 500, message = "配置值长度不能超过 500 个字符")
    private String configValue;

    @Size(max = 100, message = "配置名称长度不能超过 100 个字符")
    private String name;

    @Size(max = 50, message = "分组长度不能超过 50 个字符")
    private String group;

    @Size(max = 255, message = "备注长度不能超过 255 个字符")
    private String remark;
}
