package com.sysnest.admin.modules.message.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.sse.SseEmitterManager;
import com.sysnest.admin.modules.message.dto.MessageQuery;
import com.sysnest.admin.modules.message.dto.MessageSendDto;
import com.sysnest.admin.modules.message.entity.Message;
import com.sysnest.admin.modules.message.mapper.MessageMapper;
import com.sysnest.admin.modules.message.vo.MessageVo;
import com.sysnest.admin.modules.user.entity.User;
import com.sysnest.admin.modules.user.mapper.UserMapper;
import com.sysnest.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 站内信，相当于 Nest 的 message.service.ts
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private static final Set<String> TYPES = Set.of("1", "2", "3");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MessageMapper messageMapper;
    private final UserMapper userMapper;
    private final SseEmitterManager sseEmitterManager;

    /**
     * 发送站内信：每个接收人一条记录，发送后通过 SSE 推送 new-message
     *
     * @return 实际写入条数
     */
    public int send(MessageSendDto dto) {
        if (!StringUtils.hasText(dto.getTitle())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "消息标题不能为空");
        }
        if (dto.getTitle().length() > 100) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "消息标题不能超过 100 个字符");
        }
        if (!TYPES.contains(dto.getType())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "消息类型只能是 1、2、3");
        }
        if (dto.getContent() != null && dto.getContent().length() > 2000) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "消息内容不能超过 2000 个字符");
        }

        // 先取全部启用用户，再按 receiverIds 过滤；无效/禁用用户会被静默丢弃
        List<User> receivers = userMapper.selectList(
                Wrappers.<User>lambdaQuery().eq(User::getStatus, "1"));

        if (dto.getReceiverIds() != null && !dto.getReceiverIds().isEmpty()) {
            Set<Integer> ids = Set.copyOf(dto.getReceiverIds());
            receivers = receivers.stream().filter(user -> ids.contains(user.getId())).toList();
        }

        if (receivers.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    dto.getReceiverIds() == null || dto.getReceiverIds().isEmpty()
                            ? "当前没有可接收消息的用户"
                            : "接收人不存在或已被禁用");
        }

        String senderName = SecurityUtils.currentUsername();
        for (User receiver : receivers) {
            Message message = new Message();
            message.setSenderName(senderName);
            message.setReceiverId(receiver.getId());
            message.setReceiverName(receiver.getUsername());
            message.setTitle(dto.getTitle());
            message.setContent(dto.getContent());
            message.setType(dto.getType());
            message.setStatus("0");
            messageMapper.insert(message);
        }

        // 推送事件只带本次接收人数，前端收到后自行刷新未读数
        Map<String, Integer> eventData = Map.of("count", receivers.size());
        receivers.forEach(receiver ->
                sseEmitterManager.sendToUser(receiver.getId(), "new-message", eventData));

        return receivers.size();
    }

    /**
     * 本人收件箱
     */
    public PageResult<MessageVo> inbox(MessageQuery query) {
        if (query.getPageSize() > 100) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "每页条数不能超过 100");
        }
        Integer userId = SecurityUtils.currentUserId();
        LocalDateTime beginTime = parseTime(query.getBeginTime(), "开始时间");
        LocalDateTime endTime = parseTime(query.getEndTime(), "结束时间");

        LambdaQueryWrapper<Message> wrapper = Wrappers.<Message>lambdaQuery()
                .eq(Message::getReceiverId, userId)
                .eq(StringUtils.hasText(query.getType()), Message::getType, query.getType())
                .eq(StringUtils.hasText(query.getStatus()), Message::getStatus, query.getStatus())
                .and(StringUtils.hasText(query.getKeyword()), w -> w
                        .like(Message::getTitle, query.getKeyword())
                        .or()
                        .like(Message::getContent, query.getKeyword()))
                .ge(beginTime != null, Message::getCreatedAt, beginTime)
                .le(endTime != null, Message::getCreatedAt, endTime)
                .orderByDesc(Message::getCreatedAt);

        Page<Message> page = messageMapper.selectPage(query.toPage(), wrapper);
        List<MessageVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    /**
     * 未读数量：{ "count": n }
     */
    public long unreadCount() {
        return messageMapper.selectCount(Wrappers.<Message>lambdaQuery()
                .eq(Message::getReceiverId, SecurityUtils.currentUserId())
                .eq(Message::getStatus, "0"));
    }

    /**
     * 全部标记已读
     */
    public void readAll() {
        Message update = new Message();
        update.setStatus("1");
        update.setReadAt(LocalDateTime.now());
        messageMapper.update(update, Wrappers.<Message>lambdaQuery()
                .eq(Message::getReceiverId, SecurityUtils.currentUserId())
                .eq(Message::getStatus, "0"));
    }

    /**
     * 本人消息详情：操作他人消息等同不存在
     */
    public MessageVo detail(Integer id) {
        Message message = messageMapper.selectOne(Wrappers.<Message>lambdaQuery()
                .eq(Message::getId, id)
                .eq(Message::getReceiverId, SecurityUtils.currentUserId()));
        if (message == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "站内信不存在");
        }
        return toVo(message);
    }

    /**
     * 单条标记已读
     */
    public void read(Integer id) {
        Message update = new Message();
        update.setStatus("1");
        update.setReadAt(LocalDateTime.now());
        int affected = messageMapper.update(update, Wrappers.<Message>lambdaQuery()
                .eq(Message::getId, id)
                .eq(Message::getReceiverId, SecurityUtils.currentUserId())
                .eq(Message::getStatus, "0"));
        if (affected == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "站内信不存在或已读");
        }
    }

    /**
     * 删除本人消息
     */
    public void delete(Integer id) {
        Message message = messageMapper.selectOne(Wrappers.<Message>lambdaQuery()
                .eq(Message::getId, id)
                .eq(Message::getReceiverId, SecurityUtils.currentUserId()));
        if (message == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "站内信不存在");
        }
        messageMapper.deleteById(id);
    }

    private LocalDateTime parseTime(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, TIME_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    fieldName + "格式应为 yyyy-MM-dd HH:mm:ss");
        }
    }

    private MessageVo toVo(Message message) {
        MessageVo vo = new MessageVo();
        BeanUtils.copyProperties(message, vo);
        return vo;
    }
}
