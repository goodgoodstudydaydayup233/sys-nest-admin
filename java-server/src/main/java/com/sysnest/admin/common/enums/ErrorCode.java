package com.sysnest.admin.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 业务错误码，编号与 Nest 端 error-code.enum.ts 完全一致，前端不用改判断逻辑
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    /** 成功 */
    SUCCESS(200, "success"),

    /** 请求参数错误 */
    BAD_REQUEST(400, "请求参数错误"),

    /** 未登录 / Token 无效 */
    UNAUTHORIZED(401, "未授权"),

    /** 已登录但无权限 */
    FORBIDDEN(403, "禁止访问"),

    /** 资源不存在 */
    NOT_FOUND(404, "资源不存在"),

    /** 服务器内部错误 */
    INTERNAL_ERROR(500, "服务器内部错误"),

    // ==================== 1xxx 用户 ====================
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_PASSWORD_ERROR(1002, "密码错误"),
    USER_DISABLED(1003, "用户已被禁用"),
    USER_ALREADY_EXISTS(1004, "用户已存在"),
    USER_CANNOT_DELETE_ADMIN(1005, "超级管理员不可删除"),
    USER_CANNOT_MODIFY_ADMIN(1006, "超级管理员不可操作"),

    // ==================== 2xxx 验证码 ====================
    CAPTCHA_EXPIRED(2001, "验证码已过期"),
    CAPTCHA_ERROR(2002, "验证码错误"),

    // ==================== 3xxx Token ====================
    TOKEN_EXPIRED(3001, "Token已过期"),
    TOKEN_INVALID(3002, "Token无效"),

    // ==================== 4xxx 权限 ====================
    NO_PERMISSION(4001, "没有权限"),
    ROLE_NOT_FOUND(4002, "角色不存在"),
    ROLE_ALREADY_EXISTS(4003, "角色已存在"),

    // ==================== 5xxx 参数 ====================
    PARAM_ERROR(5001, "参数错误"),

    // ==================== 6xxx 配置 ====================
    CONFIG_NOT_FOUND(6001, "配置不存在"),

    // ==================== 7xxx 字典 ====================
    DICT_TYPE_ALREADY_EXISTS(7001, "字典类型已存在"),
    DICT_GROUP_ALREADY_EXISTS(7002, "分组编码已存在"),
    DICT_TYPE_NOT_FOUND(7003, "字典类型不存在"),
    DICT_TYPE_IN_USE(7004, "字典类型已存在字典数据，无法删除"),
    DICT_DATA_NOT_FOUND(7005, "字典数据不存在"),

    // ==================== 8xxx 定时任务 ====================
    JOB_NOT_FOUND(8001, "定时任务不存在"),
    JOB_CRON_INVALID(8002, "cron表达式不合法"),
    JOB_BEAN_NOT_FOUND(8003, "任务Bean不存在"),
    JOB_METHOD_NOT_FOUND(8004, "任务方法不存在"),
    JOB_ALREADY_RUNNING(8005, "任务正在执行，禁止并发"),

    // ==================== 9xxx 限流 ====================
    RATE_LIMIT_EXCEEDED(9001, "请求过于频繁，请稍候再试");

    private final int code;
    private final String msg;
}
