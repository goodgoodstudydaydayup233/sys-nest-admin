package com.sysnest.admin.modules.dict.dto;

import com.sysnest.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DictTypeQuery extends PageQuery {
    private String name;
    private String type;
    private Integer groupId;
    private String status;
}
