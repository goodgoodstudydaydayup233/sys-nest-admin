package com.sysnest.admin.modules.log.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 操作日志，对应表 sys_oper_log
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_oper_log")
public class SysOperLog extends BaseEntity {

    /** 模块标题 */
    private String title;

    /** 业务类型：0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8生成代码 9清空 */
    @TableField("businessType")
    private String businessType;

    /** 方法名称（全限定类名 + 方法名） */
    private String method;

    /** 请求方式 */
    @TableField("requestMethod")
    private String requestMethod;

    /** 操作人 */
    @TableField("operName")
    private String operName;

    /** 请求 URL */
    @TableField("operUrl")
    private String operUrl;

    /** 操作 IP */
    @TableField("operIp")
    private String operIp;

    /** 操作地点（暂不解析） */
    @TableField("operLocation")
    private String operLocation;

    /** 请求参数 */
    @TableField("operParam")
    private String operParam;

    /** 返回结果 */
    @TableField("jsonResult")
    private String jsonResult;

    /** 状态：0正常 1异常 */
    private String status;

    /** 异常信息 */
    @TableField("errorMsg")
    private String errorMsg;

    /** 耗时（毫秒） */
    @TableField("costTime")
    private Long costTime;
}
