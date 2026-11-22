package com.sysnest.admin.modules.config.dto;

import com.sysnest.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ConfigQuery extends PageQuery {

    private String name;
    private String group;
}
