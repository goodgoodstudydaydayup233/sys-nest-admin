package com.sysnest.admin.modules.log.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 操作日志返回结构，字段与 Nest 端 LogVo 一致
 */
@Data
public class OperLogVo {

    private Integer id;
    private String title;
    private String businessType;
    private String method;
    private String requestMethod;
    private String operName;
    private String operUrl;
    private String operIp;
    private String operLocation;
    private String operParam;
    private String jsonResult;
    private String status;
    private String errorMsg;
    private Long costTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
