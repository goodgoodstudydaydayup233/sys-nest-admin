package com.sysnest.admin.modules.log.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sysnest.admin.modules.log.entity.SysOperLog;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 操作日志 Mapper
 * 日志表按 Nest 端行为做物理删除，不走 deleteStatus 软删除
 */
public interface SysOperLogMapper extends BaseMapper<SysOperLog> {

    @Delete("<script>DELETE FROM sys_oper_log WHERE id IN "
            + "<foreach collection='ids' item='id' open='(' separator=',' close=')'>#{id}</foreach>"
            + "</script>")
    int physicalDeleteByIds(@Param("ids") List<Integer> ids);

    @Delete("DELETE FROM sys_oper_log")
    int physicalDeleteAll();
}
