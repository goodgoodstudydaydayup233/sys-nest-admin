package com.sysnest.admin.modules.role.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色-菜单关联 Mapper（中间表没有实体，直接写 SQL）
 */
public interface RoleMenuMapper {

    /**
     * 查角色绑定的菜单 ID 集合
     */
    @Select("SELECT menu_id FROM sys_role_menu WHERE role_id = #{roleId}")
    List<Integer> selectMenuIdsByRoleId(@Param("roleId") Integer roleId);

    @Delete("DELETE FROM sys_role_menu WHERE role_id = #{roleId}")
    int deleteByRoleId(@Param("roleId") Integer roleId);

    @Insert("""
            <script>
            INSERT INTO sys_role_menu (role_id, menu_id) VALUES
            <foreach collection="menuIds" item="menuId" separator=",">
            (#{roleId}, #{menuId})
            </foreach>
            </script>
            """)
    int insertBatch(@Param("roleId") Integer roleId, @Param("menuIds") List<Integer> menuIds);
}
