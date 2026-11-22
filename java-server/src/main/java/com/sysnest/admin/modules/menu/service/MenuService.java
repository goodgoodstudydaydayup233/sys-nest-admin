package com.sysnest.admin.modules.menu.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.auth.service.AuthCacheService;
import com.sysnest.admin.modules.menu.dto.MenuQuery;
import com.sysnest.admin.modules.menu.dto.MenuSaveDto;
import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.mapper.MenuMapper;
import com.sysnest.admin.modules.menu.vo.MenuTreeVo;
import com.sysnest.admin.modules.menu.vo.MenuVo;
import com.sysnest.admin.modules.menu.vo.RoleMenuTreeVo;
import com.sysnest.admin.modules.menu.util.MenuTreeUtils;
import com.sysnest.admin.modules.role.mapper.RoleMenuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 菜单管理，相当于 Nest 的 menu.service.ts
 */
@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuMapper menuMapper;
    private final RoleMenuMapper roleMenuMapper;
    private final AuthCacheService authCacheService;

    /**
     * 菜单列表：平铺、不分页
     */
    public List<MenuVo> list(MenuQuery query) {
        List<Menu> menus = menuMapper.selectList(Wrappers.<Menu>lambdaQuery()
                .like(StringUtils.hasText(query.getMenuName()), Menu::getMenuName, query.getMenuName())
                .eq(StringUtils.hasText(query.getVisible()), Menu::getVisible, query.getVisible())
                .orderByAsc(Menu::getOrderNum));
        return menus.stream().map(this::toVo).toList();
    }

    /**
     * 全部菜单树（含按钮），用于菜单管理页
     */
    public List<MenuTreeVo> tree() {
        return MenuTreeUtils.buildMenuTree(selectAllMenus());
    }

    /**
     * 角色菜单树：完整菜单树 + 角色已选 ID
     */
    public RoleMenuTreeVo roleMenuTree(Integer roleId) {
        List<MenuTreeVo> tree = MenuTreeUtils.buildMenuTree(selectAllMenus());
        List<Integer> checkedKeys = roleMenuMapper.selectMenuIdsByRoleId(roleId);
        return new RoleMenuTreeVo(tree, checkedKeys);
    }

    public MenuVo detail(Integer id) {
        Menu menu = menuMapper.selectById(id);
        return menu == null ? null : toVo(menu);
    }

    public void create(MenuSaveDto dto) {
        if (!StringUtils.hasText(dto.getMenuName())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "菜单名称不能为空");
        }
        Menu menu = new Menu();
        fill(menu, dto);
        // 新增时的默认值
        menu.setParentId(dto.getParentId() == null ? 0 : dto.getParentId());
        menu.setOrderNum(dto.getOrderNum() == null ? 0 : dto.getOrderNum());
        menu.setIsFrame(StringUtils.hasText(dto.getIsFrame()) ? dto.getIsFrame() : "1");
        menu.setIsCache(StringUtils.hasText(dto.getIsCache()) ? dto.getIsCache() : "0");
        menu.setVisible(StringUtils.hasText(dto.getVisible()) ? dto.getVisible() : "0");
        menu.setMenuType(StringUtils.hasText(dto.getMenuType()) ? dto.getMenuType() : "M");
        menuMapper.insert(menu);
        authCacheService.evictAll();
    }

    public void update(Integer id, MenuSaveDto dto) {
        Menu menu = menuMapper.selectById(id);
        if (menu == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "菜单不存在");
        }
        fill(menu, dto);
        menuMapper.updateById(menu);
        authCacheService.evictAll();
    }

    public void delete(Integer id) {
        // 存在子菜单时禁止删除
        long childCount = menuMapper.selectCount(
                Wrappers.<Menu>lambdaQuery().eq(Menu::getParentId, id));
        if (childCount > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "存在子菜单，无法删除");
        }
        menuMapper.deleteById(id);
        authCacheService.evictAll();
    }

    private List<Menu> selectAllMenus() {
        return menuMapper.selectList(Wrappers.<Menu>lambdaQuery()
                .orderByAsc(Menu::getOrderNum)
                .orderByAsc(Menu::getId));
    }

    private MenuVo toVo(Menu menu) {
        MenuVo vo = new MenuVo();
        BeanUtils.copyProperties(menu, vo);
        return vo;
    }

    private void fill(Menu menu, MenuSaveDto dto) {
        if (dto.getParentId() != null) {
            menu.setParentId(dto.getParentId());
        }
        if (dto.getMenuName() != null) {
            menu.setMenuName(dto.getMenuName());
        }
        if (dto.getOrderNum() != null) {
            menu.setOrderNum(dto.getOrderNum());
        }
        if (dto.getPath() != null) {
            menu.setPath(dto.getPath());
        }
        if (dto.getComponent() != null) {
            menu.setComponent(dto.getComponent());
        }
        if (dto.getQuery() != null) {
            menu.setQuery(dto.getQuery());
        }
        if (dto.getIsFrame() != null) {
            menu.setIsFrame(dto.getIsFrame());
        }
        if (dto.getIsCache() != null) {
            menu.setIsCache(dto.getIsCache());
        }
        if (dto.getVisible() != null) {
            menu.setVisible(dto.getVisible());
        }
        if (dto.getMenuType() != null) {
            menu.setMenuType(dto.getMenuType());
        }
        if (dto.getPerms() != null) {
            menu.setPerms(dto.getPerms());
        }
        if (dto.getIcon() != null) {
            menu.setIcon(dto.getIcon());
        }
    }
}
