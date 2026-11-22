package com.sysnest.admin.modules.auth.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.config.properties.AppProperties;
import com.sysnest.admin.modules.auth.dto.LoginDto;
import com.sysnest.admin.modules.auth.dto.RefreshTokenDto;
import com.sysnest.admin.modules.auth.vo.LoginVo;
import com.sysnest.admin.modules.auth.vo.RoleSimpleVo;
import com.sysnest.admin.modules.auth.vo.UserInfoVo;
import com.sysnest.admin.modules.captcha.service.CaptchaService;
import com.sysnest.admin.modules.config.service.SysConfigService;
import com.sysnest.admin.modules.log.service.LoginLogService;
import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.mapper.MenuMapper;
import com.sysnest.admin.modules.menu.util.MenuTreeUtils;
import com.sysnest.admin.modules.menu.vo.RouterVo;
import com.sysnest.admin.modules.online.service.OnlineUserService;
import com.sysnest.admin.modules.role.entity.Role;
import com.sysnest.admin.modules.role.mapper.RoleMapper;
import com.sysnest.admin.modules.user.entity.User;
import com.sysnest.admin.modules.user.mapper.UserMapper;
import com.sysnest.admin.security.JwtTokenProvider;
import com.sysnest.admin.security.LoginUser;
import com.sysnest.admin.security.SecurityUtils;
import com.sysnest.admin.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 认证服务，相当于 Nest 的 auth.service.ts
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String CAPTCHA_ENABLED_KEY = "sys.login.captchaEnabled";
    private static final String MAX_RETRY_KEY = "sys.login.maxRetryCount";
    private static final String LOCK_TIME_KEY = "sys.login.lockTime";

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final MenuMapper menuMapper;
    private final SysConfigService sysConfigService;
    private final CaptchaService captchaService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final RedisUtils redisUtils;
    private final AuthCacheService authCacheService;
    private final OnlineUserService onlineUserService;
    private final LoginLogService loginLogService;
    private final AppProperties appProperties;

    /**
     * 登录：验证码/锁定检查 → 用户/密码 → 状态 → 签发双 Token
     * 成功和失败都会写登录日志
     */
    public LoginVo login(LoginDto dto, HttpServletRequest request) {
        String username = dto.getUsername() == null ? "" : dto.getUsername().trim();
        try {
            LoginVo loginVo = doLogin(dto, username, request);
            loginLogService.record(username, request, true, "登录成功");
            return loginVo;
        } catch (BusinessException e) {
            loginLogService.record(username, request, false, e.getMessage());
            throw e;
        } catch (Exception e) {
            loginLogService.record(username, request, false, "登录异常");
            throw e;
        }
    }

    private LoginVo doLogin(LoginDto dto, String username, HttpServletRequest request) {
        boolean captchaEnabled = !"false".equalsIgnoreCase(sysConfigService.getValue(CAPTCHA_ENABLED_KEY));
        int maxRetryCount = sysConfigService.getIntValue(MAX_RETRY_KEY, 5);
        int lockMinutes = sysConfigService.getIntValue(LOCK_TIME_KEY, 10);

        // 1. 锁定检查优先于验证码
        if (redisUtils.get("login:lock:" + username) != null) {
            long ttl = redisUtils.getExpire("login:lock:" + username);
            long minutes = ttl > 0 ? Math.max(1, (ttl + 59) / 60) : lockMinutes;
            throw new BusinessException(ErrorCode.USER_DISABLED, "账号已锁定，请" + minutes + "分钟后重试");
        }

        // 2. 验证码
        if (captchaEnabled) {
            captchaService.verify(dto.getCaptchaKey(), dto.getCaptcha());
        }

        // 3. 用户是否存在（@TableLogic 自动过滤已删除）
        User user = userMapper.selectOne(
                Wrappers.<User>lambdaQuery().eq(User::getUsername, username));
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // 4. 密码错误计数与锁定
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            Duration window = Duration.ofMinutes(lockMinutes);
            long count = redisUtils.increment("login:retry:" + username, 1, window);
            if (count >= maxRetryCount) {
                redisUtils.set("login:lock:" + username, "1", window);
                throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR,
                        "密码错误次数已达上限(" + maxRetryCount + "次)，账号已锁定" + lockMinutes + "分钟");
            }
            throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR,
                    "密码错误，剩余尝试次数" + (maxRetryCount - count) + "次");
        }

        // 5. 状态检查（0 禁用 / 1 启用）
        if ("0".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.USER_DISABLED, "用户已被禁用");
        }

        // 6. 成功：清失败计数、写缓存/在线记录、签发 Token
        redisUtils.delete("login:retry:" + username);
        UserInfoVo userInfo = buildUserInfo(user);
        LoginUser loginUser = new LoginUser(user.getId(), user.getUsername(), userInfo.getPermissions());
        String accessToken = jwtTokenProvider.generateAccessToken(loginUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(loginUser);

        authCacheService.put(userInfo);
        onlineUserService.save(accessToken, user, request);
        return new LoginVo(accessToken, refreshToken);
    }

    /**
     * 刷新 Token：校验 refreshToken，重新签发双 Token
     */
    public LoginVo refresh(RefreshTokenDto dto) {
        LoginUser parsed;
        try {
            parsed = jwtTokenProvider.parseRefreshToken(dto.getRefreshToken());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID, "Token无效或已过期");
        }
        if (parsed.getUserId() == null) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID, "Token无效或已过期");
        }

        User user = userMapper.selectById(parsed.getUserId());
        if (user == null || "0".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID, "Token无效或已过期");
        }

        UserInfoVo userInfo = buildUserInfo(user);
        LoginUser loginUser = new LoginUser(user.getId(), user.getUsername(), userInfo.getPermissions());
        String accessToken = jwtTokenProvider.generateAccessToken(loginUser);
        String refreshToken = jwtTokenProvider.generateRefreshToken(loginUser);

        authCacheService.put(userInfo);
        // 刷新时没有原始请求信息，按 Nest 端行为只记录 token 与用户
        onlineUserService.save(accessToken, user, null);
        return new LoginVo(accessToken, refreshToken);
    }

    /**
     * 当前用户信息：缓存优先，缺失时从数据库重建
     */
    public UserInfoVo getUserInfo() {
        Integer userId = SecurityUtils.currentUserId();
        UserInfoVo cached = authCacheService.get(userId);
        if (cached != null) {
            return cached;
        }

        User user = userMapper.selectById(userId);
        if (user == null || "0".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.USER_DISABLED);
        }
        UserInfoVo userInfo = buildUserInfo(user);
        authCacheService.put(userInfo);
        return userInfo;
    }

    /**
     * 动态路由：超管拿全部目录/菜单，普通用户只拿角色授权的
     */
    public List<RouterVo> getRouters() {
        User user = userMapper.selectById(SecurityUtils.currentUserId());
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        List<Menu> menus = loadMenus(user).stream()
                .filter(menu -> !"F".equals(menu.getMenuType()))
                .toList();
        return MenuTreeUtils.build(menus);
    }

    /**
     * 登出：Token 拉黑、在线记录移除、用户缓存清理
     */
    public void logout(String accessToken) {
        Integer userId = SecurityUtils.currentUserId();
        if (StringUtils.hasText(accessToken)) {
            tokenBlacklistService.blacklist(accessToken);
            onlineUserService.remove(accessToken);
        }
        authCacheService.evict(userId);
    }

    /**
     * 组装用户信息（角色 + 菜单权限）
     */
    private UserInfoVo buildUserInfo(User user) {
        List<Role> roles = roleMapper.selectByUserId(user.getId());
        List<Menu> menus = loadMenus(user);

        Set<String> permissions = new LinkedHashSet<>();
        for (Menu menu : menus) {
            if (StringUtils.hasText(menu.getPerms())) {
                permissions.add(menu.getPerms());
            }
        }
        // 超管直接拥有通配权限，避免漏配菜单导致无法操作
        if (isAdmin(user.getUsername())) {
            permissions.add("*:*:*");
        }

        List<RoleSimpleVo> roleVos = roles.stream()
                .map(role -> new RoleSimpleVo(role.getId(), role.getName()))
                .toList();

        return new UserInfoVo(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                user.getAvatar(),
                roleVos,
                permissions);
    }

    private List<Menu> loadMenus(User user) {
        if (isAdmin(user.getUsername())) {
            return menuMapper.selectList(
                    Wrappers.<Menu>lambdaQuery().orderByAsc(Menu::getOrderNum));
        }
        return menuMapper.selectByUserId(user.getId());
    }

    private boolean isAdmin(String username) {
        return appProperties.getAdmin().equals(username);
    }
}
