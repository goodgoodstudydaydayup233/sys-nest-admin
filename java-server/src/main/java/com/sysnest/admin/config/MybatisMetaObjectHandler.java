package com.sysnest.admin.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.sysnest.admin.security.SecurityUtils;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 公共字段自动填充器：新增/修改时自动写时间、操作人、默认状态
 * 相当于 TypeORM 的 @CreateDateColumn / @UpdateDateColumn
 */
@Component
public class MybatisMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        String operator = SecurityUtils.currentUsernameOrDefault("system");

        strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
        strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
        strictInsertFill(metaObject, "createdBy", String.class, operator);
        strictInsertFill(metaObject, "updatedBy", String.class, operator);
        strictInsertFill(metaObject, "deleteStatus", String.class, "0");
        strictInsertFill(metaObject, "disabled", String.class, "0");
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
        strictUpdateFill(metaObject, "updatedBy", String.class, SecurityUtils.currentUsernameOrDefault("system"));
    }
}
