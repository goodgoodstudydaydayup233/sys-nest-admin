package com.sysnest.admin.modules.job.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.job.dto.JobLogQuery;
import com.sysnest.admin.modules.job.entity.SysJobLog;
import com.sysnest.admin.modules.job.mapper.SysJobLogMapper;
import com.sysnest.admin.modules.job.vo.JobLogVo;
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
 * 定时任务调度日志服务，对应 Nest 的 job-log.service.ts
 */
@Service
@RequiredArgsConstructor
public class JobLogService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SysJobLogMapper sysJobLogMapper;

    public PageResult<JobLogVo> page(JobLogQuery query) {
        LocalDateTime beginTime = parseBeginTime(query.getBeginTime());
        LocalDateTime endTime = parseEndTime(query.getEndTime());

        Page<SysJobLog> page = sysJobLogMapper.selectPage(query.toPage(), Wrappers.<SysJobLog>lambdaQuery()
                .like(StringUtils.hasText(query.getJobName()), SysJobLog::getJobName, query.getJobName())
                .eq(StringUtils.hasText(query.getJobGroup()), SysJobLog::getJobGroup, query.getJobGroup())
                .eq(StringUtils.hasText(query.getStatus()), SysJobLog::getStatus, query.getStatus())
                .ge(beginTime != null, SysJobLog::getCreateTime, beginTime)
                .le(endTime != null, SysJobLog::getCreateTime, endTime)
                .orderByDesc(SysJobLog::getJobLogId));

        List<JobLogVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public JobLogVo detail(Integer id) {
        SysJobLog jobLog = sysJobLogMapper.selectById(id);
        return jobLog == null ? null : toVo(jobLog);
    }

    public void remove(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        sysJobLogMapper.deleteByIds(ids);
    }

    public void cleanAll() {
        sysJobLogMapper.delete(null);
    }

    private LocalDateTime parseBeginTime(String value) {
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

    private JobLogVo toVo(SysJobLog jobLog) {
        JobLogVo vo = new JobLogVo();
        BeanUtils.copyProperties(jobLog, vo);
        return vo;
    }
}
