package com.sysnest.admin.modules.log.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.log.dto.OperLogQuery;
import com.sysnest.admin.modules.log.entity.SysOperLog;
import com.sysnest.admin.modules.log.mapper.SysOperLogMapper;
import com.sysnest.admin.modules.log.vo.OperLogVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * 操作日志查询服务，对应 Nest 的 log.service.ts
 * 写入由 OperLogAspect 负责，这里只做查询、删除、清空
 */
@Service
@RequiredArgsConstructor
public class OperLogService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SysOperLogMapper sysOperLogMapper;

    public PageResult<OperLogVo> page(OperLogQuery query) {
        LocalDateTime startTime = parseStartTime(query.getStartTime());
        LocalDateTime endTime = parseEndTime(query.getEndTime());

        Page<SysOperLog> page = sysOperLogMapper.selectPage(query.toPage(), Wrappers.<SysOperLog>lambdaQuery()
                .like(StringUtils.hasText(query.getTitle()), SysOperLog::getTitle, query.getTitle())
                .like(StringUtils.hasText(query.getOperName()), SysOperLog::getOperName, query.getOperName())
                .eq(StringUtils.hasText(query.getBusinessType()), SysOperLog::getBusinessType, query.getBusinessType())
                .eq(StringUtils.hasText(query.getStatus()), SysOperLog::getStatus, query.getStatus())
                .eq(StringUtils.hasText(query.getRequestMethod()), SysOperLog::getRequestMethod, query.getRequestMethod())
                .ge(startTime != null, SysOperLog::getCreatedAt, startTime)
                .le(endTime != null, SysOperLog::getCreatedAt, endTime)
                .orderByDesc(SysOperLog::getId));

        List<OperLogVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public OperLogVo detail(Integer id) {
        SysOperLog operLog = sysOperLogMapper.selectById(id);
        return operLog == null ? null : toVo(operLog);
    }

    public void remove(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        sysOperLogMapper.physicalDeleteByIds(ids);
    }

    public void cleanAll() {
        sysOperLogMapper.physicalDeleteAll();
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

    private OperLogVo toVo(SysOperLog operLog) {
        OperLogVo vo = new OperLogVo();
        BeanUtils.copyProperties(operLog, vo);
        return vo;
    }
}
