package com.sysnest.admin.modules.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 发送站内信参数
 */
@Data
public class MessageSendDto {

    @NotBlank(message = "消息标题不能为空")
    @Size(max = 100, message = "消息标题不能超过 100 个字符")
    private String title;

    @NotBlank(message = "消息类型不能为空")
    @Pattern(regexp = "^[123]$", message = "消息类型仅支持 1-系统通知 / 2-业务提醒 / 3-任务结果")
    private String type;

    @Size(max = 2000, message = "消息内容不能超过 2000 个字符")
    private String content;

    /** 接收人 ID；不传或空数组表示发给全部启用用户 */
    private List<@NotNull(message = "接收用户 ID 不能为空") Integer> receiverIds;
}
