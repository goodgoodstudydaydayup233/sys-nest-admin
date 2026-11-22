package com.sysnest.admin.modules.notice.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sysnest.admin.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 通知公告，对应表 sys_notice
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_notice")
public class Notice extends BaseEntity {

    /** 通知标题 */
    @TableField("noticeTitle")
    private String noticeTitle;

    /** 通知类型：1-通知 2-公告 */
    @TableField("noticeType")
    private String noticeType;

    /** 通知内容 */
    @TableField("noticeContent")
    private String noticeContent;

    /** 状态：0-正常 1-关闭 */
    private String status;
}
