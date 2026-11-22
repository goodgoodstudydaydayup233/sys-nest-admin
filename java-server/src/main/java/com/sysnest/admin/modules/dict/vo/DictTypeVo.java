package com.sysnest.admin.modules.dict.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DictTypeVo {
    private Integer id;
    private String name;
    private String type;
    private Integer groupId;
    private String groupName;
    private Integer sort;
    private String status;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
