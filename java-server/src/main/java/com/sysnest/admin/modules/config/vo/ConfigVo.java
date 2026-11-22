package com.sysnest.admin.modules.config.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConfigVo {

    private Integer id;
    private String configKey;
    private String configValue;
    private String name;
    private String group;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
