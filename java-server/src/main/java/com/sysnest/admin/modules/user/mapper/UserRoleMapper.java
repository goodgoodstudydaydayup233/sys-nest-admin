package com.sysnest.admin.modules.user.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户-角色关联 Mapper（中间表没有实体，直接写 SQL）
 */
public interface UserRoleMapper {

    @Select("SELECT role_id FROM sys_user_role WHERE user_id = #{userId}")
    List<Integer> selectRoleIdsByUserId(@Param("userId") Integer userId);

    /**
     * 统计某个角色被多少用户使用，用于删除角色前的关联校验
     */
    @Select("SELECT COUNT(*) FROM sys_user_role WHERE role_id = #{roleId}")
    long countByRoleId(@Param("roleId") Integer roleId);

    @Delete("DELETE FROM sys_user_role WHERE user_id = #{userId}")
    int deleteByUserId(@Param("userId") Integer userId);

    @Insert("""
            <script>
            INSERT INTO sys_user_role (user_id, role_id) VALUES
            <foreach collection="roleIds" item="roleId" separator=",">
            (#{userId}, #{roleId})
            </foreach>
            </script>
            """)
    int insertBatch(@Param("userId") Integer userId, @Param("roleIds") List<Integer> roleIds);
}
