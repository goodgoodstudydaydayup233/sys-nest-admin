package com.sysnest.admin.modules.dict.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sysnest.admin.modules.dict.entity.DictData;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 字典数据 Mapper
 */
public interface DictDataMapper extends BaseMapper<DictData> {

    /**
     * 按字典类型取启用数据，要求类型本身也是启用状态
     */
    @Select("""
            SELECT d.* FROM sys_dict_data d
            INNER JOIN sys_dict_type t ON t.id = d.type_id
            WHERE t.type = #{dictType}
              AND t.deleteStatus = '0' AND t.status = '1'
              AND d.deleteStatus = '0' AND d.status = '1'
            ORDER BY d.sort ASC, d.id ASC
            """)
    List<DictData> selectEnabledByType(@Param("dictType") String dictType);
}
