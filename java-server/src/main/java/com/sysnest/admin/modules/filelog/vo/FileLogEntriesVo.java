package com.sysnest.admin.modules.filelog.vo;

import lombok.Data;

import java.util.List;

/**
 * 日志内容分页响应
 */
@Data
public class FileLogEntriesVo {

    private List<FileLogEntryVo> list;
    private long total;
    private long page;
    private long pageSize;
    private boolean truncated;
}
