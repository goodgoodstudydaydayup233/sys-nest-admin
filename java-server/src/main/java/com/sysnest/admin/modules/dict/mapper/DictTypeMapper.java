package com.sysnest.admin.modules.dict.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sysnest.admin.modules.dict.entity.DictType;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 字典类型 Mapper
 */
public interface DictTypeMapper extends BaseMapper<DictType> {

    /**
     * 所有启用的字典类型，按 sort 升序
     */
    @Select("""
            SELECT * FROM sys_dict_type
            WHERE deleteStatus = '0' AND status = '1'
            ORDER BY sort ASC, id ASC
            """)
    List<DictType> selectEnabledTypes();
}
