package com.sysnest.admin.modules.notice.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.notice.dto.NoticeQuery;
import com.sysnest.admin.modules.notice.dto.NoticeSaveDto;
import com.sysnest.admin.modules.notice.entity.Notice;
import com.sysnest.admin.modules.notice.mapper.NoticeMapper;
import com.sysnest.admin.modules.notice.vo.NoticeVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

/**
 * 通知公告，相当于 Nest 的 notice.service.ts
 */
@Service
@RequiredArgsConstructor
public class NoticeService {

    private static final Set<String> NOTICE_TYPES = Set.of("1", "2");
    private static final Set<String> STATUSES = Set.of("0", "1");

    private final NoticeMapper noticeMapper;

    public PageResult<NoticeVo> page(NoticeQuery query) {
        Page<Notice> page = noticeMapper.selectPage(query.toPage(), Wrappers.<Notice>lambdaQuery()
                .like(StringUtils.hasText(query.getNoticeTitle()), Notice::getNoticeTitle, query.getNoticeTitle())
                .like(StringUtils.hasText(query.getCreateBy()), Notice::getCreatedBy, query.getCreateBy())
                .eq(StringUtils.hasText(query.getNoticeType()), Notice::getNoticeType, query.getNoticeType())
                .orderByDesc(Notice::getCreatedAt));

        List<NoticeVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public NoticeVo detail(Integer id) {
        Notice notice = requireNotice(id);
        return toVo(notice);
    }

    public NoticeVo create(NoticeSaveDto dto) {
        if (!StringUtils.hasText(dto.getNoticeTitle())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "通知标题不能为空");
        }
        if (!NOTICE_TYPES.contains(dto.getNoticeType())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "通知类型只能是 1-通知 或 2-公告");
        }
        if (dto.getStatus() != null && !STATUSES.contains(dto.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "状态只能是 0-正常 或 1-关闭");
        }

        Notice notice = new Notice();
        notice.setNoticeTitle(dto.getNoticeTitle());
        notice.setNoticeType(dto.getNoticeType());
        notice.setNoticeContent(dto.getNoticeContent());
        notice.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "0");
        noticeMapper.insert(notice);
        return toVo(noticeMapper.selectById(notice.getId()));
    }

    public NoticeVo update(Integer id, NoticeSaveDto dto) {
        Notice notice = requireNotice(id);
        if (dto.getNoticeType() != null && !NOTICE_TYPES.contains(dto.getNoticeType())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "通知类型只能是 1-通知 或 2-公告");
        }
        if (dto.getStatus() != null && !STATUSES.contains(dto.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "状态只能是 0-正常 或 1-关闭");
        }

        if (dto.getNoticeTitle() != null) {
            notice.setNoticeTitle(dto.getNoticeTitle());
        }
        if (dto.getNoticeType() != null) {
            notice.setNoticeType(dto.getNoticeType());
        }
        if (dto.getNoticeContent() != null) {
            notice.setNoticeContent(dto.getNoticeContent());
        }
        if (dto.getStatus() != null) {
            notice.setStatus(dto.getStatus());
        }
        noticeMapper.updateById(notice);
        return toVo(noticeMapper.selectById(id));
    }

    public void delete(Integer id) {
        requireNotice(id);
        noticeMapper.deleteById(id);
    }

    private Notice requireNotice(Integer id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "通知公告不存在");
        }
        return notice;
    }

    private NoticeVo toVo(Notice notice) {
        NoticeVo vo = new NoticeVo();
        BeanUtils.copyProperties(notice, vo);
        vo.setCreateBy(notice.getCreatedBy());
        return vo;
    }
}
