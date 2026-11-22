package com.sysnest.admin.modules.role.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sysnest.admin.modules.role.entity.Role;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色 Mapper
 */
public interface RoleMapper extends BaseMapper<Role> {

    /**
     * 查某个用户拥有的角色
     * 注意：与 Nest 端保持一致，这里不按角色的 deleteStatus 过滤
     */
    @Select("""
            SELECT r.* FROM sys_role r
            INNER JOIN sys_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = #{userId}
            """)
    List<Role> selectByUserId(@Param("userId") Integer userId);
}
