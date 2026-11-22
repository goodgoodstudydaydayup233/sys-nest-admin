package com.sysnest.admin.modules.filelog.vo;

import lombok.Data;

import java.util.List;

/**
 * 日志文件列表响应
 */
@Data
public class FileLogFilesVo {

    private List<FileLogFileVo> list;
    private long total;
    private long page;
    private long pageSize;
    private long totalSize;
    private String totalSizeText;
    private long totalFiles;
}
