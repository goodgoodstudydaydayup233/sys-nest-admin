package com.sysnest.admin.modules.log.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 登录日志，对应表 sys_logininfor
 * 这张表没有公共审计字段，所以不继承 BaseEntity
 */
@Data
@TableName("sys_logininfor")
public class LoginLog {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 登录用户名 */
    @TableField("userName")
    private String userName;

    /** 登录 IP */
    private String ipaddr;

    /** 登录地点（暂不解析，保留默认空串） */
    @TableField("loginLocation")
    private String loginLocation;

    /** 浏览器 */
    private String browser;

    /** 操作系统 */
    private String os;

    /** 状态：0成功 1失败 */
    private String status;

    /** 提示信息 */
    private String msg;

    /** 登录时间 */
    @TableField("loginTime")
    private LocalDateTime loginTime;
}
