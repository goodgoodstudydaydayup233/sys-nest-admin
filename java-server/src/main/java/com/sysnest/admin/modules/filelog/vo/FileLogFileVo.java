package com.sysnest.admin.modules.filelog.vo;

import lombok.Data;

/**
 * 日志文件信息
 */
@Data
public class FileLogFileVo {

    private String name;
    private String category;
    private long size;
    private String sizeText;
    private String mtime;
}
