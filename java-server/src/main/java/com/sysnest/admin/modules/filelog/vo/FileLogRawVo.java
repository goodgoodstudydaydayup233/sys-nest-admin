package com.sysnest.admin.modules.filelog.vo;

import lombok.Data;

import java.util.List;

/**
 * 日志文件原始内容分页响应
 */
@Data
public class FileLogRawVo {

    private List<String> content;
    private long total;
    private long page;
    private long pageSize;
    private boolean truncated;
}
