package com.sysnest.admin.common.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 公共实体字段，相当于 Nest 的 base.entity.ts
 * 所有业务实体继承它，避免重复写 id、删除标记、创建人、时间
 */
@Data
public abstract class BaseEntity implements Serializable {

    /** 主键，数据库自增 */
    @TableId(type = IdType.AUTO)
    private Integer id;

    /** 逻辑删除标记：0-未删除 1-已删除 */
    @TableLogic
    @TableField("deleteStatus")
    private String deleteStatus;

    /** 启用状态：0-启用 1-禁用 */
    private String disabled;

    /** 创建者 */
    @TableField(value = "createdBy", fill = FieldFill.INSERT)
    private String createdBy;

    /** 更新者 */
    @TableField(value = "updatedBy", fill = FieldFill.INSERT_UPDATE)
    private String updatedBy;

    /** 创建时间 */
    @TableField(value = "createdAt", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 更新时间 */
    @TableField(value = "updatedAt", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
