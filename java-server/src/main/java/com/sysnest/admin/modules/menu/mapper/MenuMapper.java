package com.sysnest.admin.modules.menu.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sysnest.admin.modules.menu.entity.Menu;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 菜单 Mapper
 */
public interface MenuMapper extends BaseMapper<Menu> {

    /**
     * 查某个用户通过角色获得的全部菜单（含按钮，用于提取权限点）
     */
    @Select("""
            SELECT DISTINCT m.* FROM sys_menu m
            INNER JOIN sys_role_menu rm ON rm.menu_id = m.id
            INNER JOIN sys_user_role ur ON ur.role_id = rm.role_id
            WHERE ur.user_id = #{userId} AND m.deleteStatus = '0'
            ORDER BY m.orderNum ASC, m.id ASC
            """)
    List<Menu> selectByUserId(@Param("userId") Integer userId);

    /**
     * 查某个角色绑定的菜单，用于角色详情回显
     */
    @Select("""
            SELECT m.* FROM sys_menu m
            INNER JOIN sys_role_menu rm ON rm.menu_id = m.id
            WHERE rm.role_id = #{roleId} AND m.deleteStatus = '0'
            ORDER BY m.orderNum ASC, m.id ASC
            """)
    List<Menu> selectByRoleId(@Param("roleId") Integer roleId);
}
