package com.sysnest.admin.modules.log.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.IpUtils;
import com.sysnest.admin.common.util.UaUtils;
import com.sysnest.admin.modules.log.dto.LoginLogQuery;
import com.sysnest.admin.modules.log.entity.LoginLog;
import com.sysnest.admin.modules.log.mapper.LoginLogMapper;
import com.sysnest.admin.modules.log.vo.LoginLogVo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * 登录日志服务：既负责登录成功/失败落库，也负责查询、删除、清空
 * 对应 Nest 的 login-log.service.ts
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginLogService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final LoginLogMapper loginLogMapper;

    /**
     * 记录登录日志，写失败不影响登录主流程
     *
     * @param username 输入的用户名
     * @param success  是否成功
     * @param msg      提示信息
     */
    public void record(String username, HttpServletRequest request, boolean success, String msg) {
        try {
            String userAgent = request == null ? null : request.getHeader("User-Agent");
            LoginLog entity = new LoginLog();
            entity.setUserName(username == null ? "" : username);
            entity.setIpaddr(request == null ? "unknown" : IpUtils.getClientIp(request));
            entity.setLoginLocation("");
            entity.setBrowser(UaUtils.parseBrowser(userAgent));
            entity.setOs(UaUtils.parseOs(userAgent));
            entity.setStatus(success ? "0" : "1");
            entity.setMsg(msg == null ? "" : msg);
            entity.setLoginTime(LocalDateTime.now());
            loginLogMapper.insert(entity);
        } catch (Exception e) {
            log.warn("登录日志保存失败：{}", e.getMessage());
        }
    }

    public PageResult<LoginLogVo> page(LoginLogQuery query) {
        LocalDateTime startTime = parseStartTime(query.getStartTime());
        LocalDateTime endTime = parseEndTime(query.getEndTime());

        Page<LoginLog> page = loginLogMapper.selectPage(query.toPage(), Wrappers.<LoginLog>lambdaQuery()
                .like(StringUtils.hasText(query.getUserName()), LoginLog::getUserName, query.getUserName())
                .like(StringUtils.hasText(query.getIpaddr()), LoginLog::getIpaddr, query.getIpaddr())
                .eq(StringUtils.hasText(query.getStatus()), LoginLog::getStatus, query.getStatus())
                .ge(startTime != null, LoginLog::getLoginTime, startTime)
                .le(endTime != null, LoginLog::getLoginTime, endTime)
                .orderByDesc(LoginLog::getId));

        List<LoginLogVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public LoginLogVo detail(Integer id) {
        LoginLog loginLog = loginLogMapper.selectById(id);
        return loginLog == null ? null : toVo(loginLog);
    }

    public void remove(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        loginLogMapper.deleteByIds(ids);
    }

    public void cleanAll() {
        loginLogMapper.delete(null);
    }

    private LocalDateTime parseStartTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            if (value.length() == 10) {
                return LocalDate.parse(value).atStartOfDay();
            }
            return LocalDateTime.parse(value, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "开始时间格式应为 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss");
        }
    }

    private LocalDateTime parseEndTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            if (value.length() == 10) {
                return LocalDate.parse(value).atTime(23, 59, 59);
            }
            return LocalDateTime.parse(value, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "结束时间格式应为 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss");
        }
    }

    private LoginLogVo toVo(LoginLog loginLog) {
        LoginLogVo vo = new LoginLogVo();
        BeanUtils.copyProperties(loginLog, vo);
        return vo;
    }
}
