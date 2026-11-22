package com.sysnest.admin.modules.filelog.vo;

import lombok.Data;

/**
 * 单条日志内容，字段与 Nest 端 FileLogEntryVo 一致
 */
@Data
public class FileLogEntryVo {

    private String ts;
    private String level;
    private String category;
    private String message;
    private String context;
    private String stack;
    private String method;
    private String url;
    private Integer status;
    private String ip;
    private String user;
    private Integer cost;
    private String ua;
}
