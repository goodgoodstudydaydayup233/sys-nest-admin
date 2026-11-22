package com.sysnest.admin.modules.filelog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 删除日志文件参数
 */
@Data
public class FileLogRemoveDto {

    @NotBlank(message = "日志文件名不能为空")
    private String name;
}
