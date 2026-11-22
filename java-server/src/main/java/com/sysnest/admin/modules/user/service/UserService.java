package com.sysnest.admin.modules.user.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.config.properties.AppProperties;
import com.sysnest.admin.modules.auth.service.AuthCacheService;
import com.sysnest.admin.modules.auth.vo.RoleSimpleVo;
import com.sysnest.admin.modules.config.service.SysConfigService;
import com.sysnest.admin.modules.online.service.OnlineUserService;
import com.sysnest.admin.modules.role.entity.Role;
import com.sysnest.admin.modules.role.mapper.RoleMapper;
import com.sysnest.admin.modules.user.dto.PasswordDto;
import com.sysnest.admin.modules.user.dto.ProfileDto;
import com.sysnest.admin.modules.user.dto.ResetPasswordDto;
import com.sysnest.admin.modules.user.dto.UserQuery;
import com.sysnest.admin.modules.user.dto.UserSaveDto;
import com.sysnest.admin.modules.user.entity.User;
import com.sysnest.admin.modules.user.mapper.UserMapper;
import com.sysnest.admin.modules.user.mapper.UserRoleMapper;
import com.sysnest.admin.modules.user.vo.UserVo;
import com.sysnest.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.sysnest.admin.common.service.FileService;

import java.util.List;

/**
 * 用户管理，相当于 Nest 的 user.service.ts
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_PASSWORD_KEY = "sys.user.defaultPassword";

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final SysConfigService sysConfigService;
    private final FileService fileService;
    private final OnlineUserService onlineUserService;
    private final AuthCacheService authCacheService;
    private final AppProperties appProperties;

    /**
     * 用户列表：按 id 升序，返回角色简要信息
     */
    public PageResult<UserVo> page(UserQuery query) {
        Page<User> page = userMapper.selectPage(query.toPage(), Wrappers.<User>lambdaQuery()
                .like(StringUtils.hasText(query.getUsername()), User::getUsername, query.getUsername())
                .like(StringUtils.hasText(query.getNickname()), User::getNickname, query.getNickname())
                .like(StringUtils.hasText(query.getPhone()), User::getPhone, query.getPhone())
                .eq(StringUtils.hasText(query.getStatus()), User::getStatus, query.getStatus())
                .orderByAsc(User::getId));

        List<UserVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    /**
     * 用户详情，不存在返回 null（与 Nest 行为一致）
     */
    public UserVo detail(Integer id) {
        User user = userMapper.selectById(id);
        return user == null ? null : toVo(user);
    }

    /**
     * 新增用户：默认密码、角色绑定、用户名唯一
     */
    public void create(UserSaveDto dto, List<Integer> roleIds, MultipartFile avatarFile) {
        String username = trim(dto.getUsername());
        if (!StringUtils.hasText(username)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "用户名不能为空");
        }
        if (!StringUtils.hasText(dto.getNickname())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "昵称不能为空");
        }
        if (existsUsername(username, null)) {
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS, "用户名已存在");
        }

        String rawPassword = StringUtils.hasText(dto.getPassword())
                ? dto.getPassword()
                : defaultPassword();
        checkPasswordLength(rawPassword);

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setNickname(dto.getNickname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "1");
        user.setSex(StringUtils.hasText(dto.getSex()) ? dto.getSex() : "3");
        user.setRemark(dto.getRemark());
        if (avatarFile != null && !avatarFile.isEmpty()) {
            user.setAvatar(fileService.upload(avatarFile, "avatar"));
        }
        userMapper.insert(user);

        bindRoles(user.getId(), roleIds);
    }

    /**
     * 修改用户：超管关键字段保护、唯一性、角色重绑、禁用后强制下线
     */
    public void update(Integer id, UserSaveDto dto, List<Integer> roleIds, MultipartFile avatarFile) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        // 与 Nest 的 UpdateUserDto 对齐：昵称必填
        if (!StringUtils.hasText(dto.getNickname())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "昵称不能为空");
        }

        // 超级管理员不允许改用户名、状态、角色
        if (isAdmin(user.getUsername())
                && (dto.getUsername() != null || dto.getStatus() != null || roleIds != null)) {
            throw new BusinessException(ErrorCode.USER_CANNOT_MODIFY_ADMIN, "超级管理员的关键信息不可修改");
        }

        if (StringUtils.hasText(dto.getUsername()) && !dto.getUsername().equals(user.getUsername())
                && existsUsername(dto.getUsername(), id)) {
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS, "用户名已存在");
        }
        // 密码不在用户编辑接口中修改（与 Nest 的 UpdateUserDto 一致，密码走 changePassword/resetPassword）
        if (StringUtils.hasText(dto.getUsername())) {
            user.setUsername(dto.getUsername().trim());
        }
        if (dto.getNickname() != null) {
            user.setNickname(dto.getNickname());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }
        if (dto.getSex() != null) {
            user.setSex(dto.getSex());
        }
        if (dto.getRemark() != null) {
            user.setRemark(dto.getRemark());
        }
        if (avatarFile != null && !avatarFile.isEmpty()) {
            user.setAvatar(fileService.upload(avatarFile, "avatar"));
        }

        userMapper.updateById(user);

        if (roleIds != null) {
            rebindRoles(id, roleIds);
        }
        authCacheService.syncProfile(id, user.getNickname(), user.getAvatar());

        if ("0".equals(user.getStatus())) {
            forceLogout(id);
        }
    }

    /**
     * 删除用户：软删除 + 强制下线
     */
    public void delete(Integer id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return;
        }
        if (isAdmin(user.getUsername())) {
            throw new BusinessException(ErrorCode.USER_CANNOT_MODIFY_ADMIN, "超级管理员不可删除");
        }
        userMapper.deleteById(id);
        forceLogout(id);
    }

    public void batchDelete(List<Integer> ids) {
        for (Integer id : ids) {
            delete(id);
        }
    }

    /**
     * 管理员修改指定用户密码
     */
    public void changePassword(Integer id, PasswordDto dto) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (isAdmin(user.getUsername())) {
            throw new BusinessException(ErrorCode.USER_CANNOT_MODIFY_ADMIN, "超级管理员密码只能由本人修改");
        }
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR, "旧密码错误");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    /**
     * 管理员重置指定用户密码
     */
    public void resetPassword(Integer id, ResetPasswordDto dto) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (isAdmin(user.getUsername())) {
            throw new BusinessException(ErrorCode.USER_CANNOT_MODIFY_ADMIN, "超级管理员密码不可重置");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    /**
     * 修改个人信息
     */
    public void updateProfile(ProfileDto dto, MultipartFile avatarFile) {
        Integer userId = SecurityUtils.currentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (dto.getNickname() != null) {
            user.setNickname(dto.getNickname());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getSex() != null) {
            user.setSex(dto.getSex());
        }
        if (StringUtils.hasText(dto.getAvatar())) {
            user.setAvatar(dto.getAvatar());
        }
        if (avatarFile != null && !avatarFile.isEmpty()) {
            user.setAvatar(fileService.upload(avatarFile, "avatar"));
        }
        userMapper.updateById(user);
        authCacheService.syncProfile(userId, user.getNickname(), user.getAvatar());
    }

    /**
     * 修改本人密码
     */
    public void changeOwnPassword(PasswordDto dto) {
        User user = userMapper.selectById(SecurityUtils.currentUserId());
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR, "旧密码错误");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    /**
     * 上传头像
     */
    public void updateAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "请选择头像文件");
        }
        Integer userId = SecurityUtils.currentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        user.setAvatar(fileService.upload(file, "avatar"));
        userMapper.updateById(user);
        authCacheService.syncProfile(userId, user.getNickname(), user.getAvatar());
    }

    private void bindRoles(Integer userId, List<Integer> roleIds) {
        if (roleIds != null && !roleIds.isEmpty()) {
            userRoleMapper.insertBatch(userId, roleIds);
        }
    }

    private void rebindRoles(Integer userId, List<Integer> roleIds) {
        userRoleMapper.deleteByUserId(userId);
        bindRoles(userId, roleIds);
    }

    private void forceLogout(Integer userId) {
        onlineUserService.forceLogout(userId);
        authCacheService.evict(userId);
    }

    private boolean existsUsername(String username, Integer excludeId) {
        return userMapper.selectCount(Wrappers.<User>lambdaQuery()
                .eq(User::getUsername, username)
                .ne(excludeId != null, User::getId, excludeId)) > 0;
    }

    private String defaultPassword() {
        String value = sysConfigService.getValue(DEFAULT_PASSWORD_KEY);
        return StringUtils.hasText(value) ? value : "123456";
    }

    private void checkPasswordLength(String password) {
        if (password == null || password.length() < 6) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "密码至少 6 位");
        }
    }

    private boolean isAdmin(String username) {
        return appProperties.getAdmin().equals(username);
    }

    private UserVo toVo(User user) {
        UserVo vo = new UserVo();
        BeanUtils.copyProperties(user, vo);
        List<Role> roles = roleMapper.selectByUserId(user.getId());
        vo.setRoles(roles.stream()
                .map(role -> new RoleSimpleVo(role.getId(), role.getName()))
                .toList());
        return vo;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
