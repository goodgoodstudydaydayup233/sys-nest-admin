package com.sysnest.admin.modules.role.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.auth.service.AuthCacheService;
import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.mapper.MenuMapper;
import com.sysnest.admin.modules.role.dto.RoleQuery;
import com.sysnest.admin.modules.role.dto.RoleSaveDto;
import com.sysnest.admin.modules.role.entity.Role;
import com.sysnest.admin.modules.role.mapper.RoleMapper;
import com.sysnest.admin.modules.role.mapper.RoleMenuMapper;
import com.sysnest.admin.modules.role.vo.MenuSimpleVo;
import com.sysnest.admin.modules.role.vo.RoleVo;
import com.sysnest.admin.modules.user.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 角色管理，相当于 Nest 的 role.service.ts
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleMapper roleMapper;
    private final RoleMenuMapper roleMenuMapper;
    private final MenuMapper menuMapper;
    private final UserRoleMapper userRoleMapper;
    private final AuthCacheService authCacheService;

    public PageResult<RoleVo> page(RoleQuery query) {
        Page<Role> page = roleMapper.selectPage(query.toPage(), Wrappers.<Role>lambdaQuery()
                .like(StringUtils.hasText(query.getName()), Role::getName, query.getName())
                .eq(StringUtils.hasText(query.getStatus()), Role::getStatus, query.getStatus())
                .orderByAsc(Role::getSort));

        List<RoleVo> list = page.getRecords().stream()
                .map(role -> toVo(role, true))
                .toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    /**
     * 全部角色（下拉框用），不过滤 status
     */
    public List<RoleVo> all() {
        return roleMapper.selectList(Wrappers.<Role>lambdaQuery().orderByAsc(Role::getSort))
                .stream().map(role -> toVo(role, false)).toList();
    }

    public RoleVo detail(Integer id) {
        Role role = roleMapper.selectById(id);
        return role == null ? null : toVo(role, true);
    }

    public void create(RoleSaveDto dto) {
        if (!StringUtils.hasText(dto.getName()) || !StringUtils.hasText(dto.getCode())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "角色名称和编码不能为空");
        }
        if (existsName(dto.getName(), null)) {
            throw new BusinessException(ErrorCode.ROLE_ALREADY_EXISTS, "角色名称已存在");
        }

        Role role = new Role();
        role.setName(dto.getName());
        role.setCode(dto.getCode());
        role.setPermission(dto.getPermission());
        role.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "1");
        role.setSort(dto.getSort() == null ? 0 : dto.getSort());
        role.setRemark(dto.getRemark());
        roleMapper.insert(role);

        if (dto.getMenuIds() != null && !dto.getMenuIds().isEmpty()) {
            roleMenuMapper.insertBatch(role.getId(), dto.getMenuIds());
        }
    }

    public void update(Integer id, RoleSaveDto dto) {
        Role role = roleMapper.selectById(id);
        if (role == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }
        if (StringUtils.hasText(dto.getName()) && existsName(dto.getName(), id)) {
            throw new BusinessException(ErrorCode.ROLE_ALREADY_EXISTS, "角色名称已存在");
        }

        if (dto.getName() != null) {
            role.setName(dto.getName());
        }
        if (dto.getCode() != null) {
            role.setCode(dto.getCode());
        }
        if (dto.getPermission() != null) {
            role.setPermission(dto.getPermission());
        }
        if (dto.getStatus() != null) {
            role.setStatus(dto.getStatus());
        }
        if (dto.getSort() != null) {
            role.setSort(dto.getSort());
        }
        if (dto.getRemark() != null) {
            role.setRemark(dto.getRemark());
        }
        roleMapper.updateById(role);

        // menuIds 不传表示不改，传空数组表示清空
        if (dto.getMenuIds() != null) {
            roleMenuMapper.deleteByRoleId(id);
            if (!dto.getMenuIds().isEmpty()) {
                roleMenuMapper.insertBatch(id, dto.getMenuIds());
            }
        }

        // 角色权限变了，所有用户缓存都要失效
        authCacheService.evictAll();
    }

    public void delete(Integer id) {
        Role role = roleMapper.selectById(id);
        if (role == null) {
            return;
        }
        // 已分配给用户的角色不允许删除
        if (userRoleMapper.countByRoleId(id) > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "该角色已分配给用户，无法删除");
        }
        roleMapper.deleteById(id);
        authCacheService.evictAll();
    }

    public void batchDelete(List<Integer> ids) {
        for (Integer id : ids) {
            delete(id);
        }
    }

    private boolean existsName(String name, Integer excludeId) {
        return roleMapper.selectCount(Wrappers.<Role>lambdaQuery()
                .eq(Role::getName, name)
                .ne(excludeId != null, Role::getId, excludeId)) > 0;
    }

    private RoleVo toVo(Role role, boolean withMenus) {
        RoleVo vo = new RoleVo();
        BeanUtils.copyProperties(role, vo);
        if (withMenus) {
            List<Menu> menus = menuMapper.selectByRoleId(role.getId());
            vo.setMenus(menus.stream()
                    .map(menu -> new MenuSimpleVo(menu.getId(), menu.getMenuName(), menu.getPerms()))
                    .toList());
        }
        return vo;
    }
}
