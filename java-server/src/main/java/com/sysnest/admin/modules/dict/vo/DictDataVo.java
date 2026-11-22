package com.sysnest.admin.modules.dict.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DictDataVo {
    private Integer id;
    private String label;
    private String value;
    private Integer typeId;
    private String cssClass;
    private String listClass;
    private Integer sort;
    private String status;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
