package com.sysnest.admin.common.api;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量操作入参：{ "ids": [1, 2] }
 */
@Data
public class IdsDto {

    @NotEmpty(message = "请选择要操作的数据")
    private List<Integer> ids;
}
