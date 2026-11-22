package com.sysnest.admin.modules.dict.dto;

import com.sysnest.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DictDataQuery extends PageQuery {
    private String label;
    private Integer typeId;
    private String dictType;
    private String status;
}
