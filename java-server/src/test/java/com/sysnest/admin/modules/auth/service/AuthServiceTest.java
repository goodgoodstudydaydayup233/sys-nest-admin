package com.sysnest.admin.modules.auth.service;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.config.properties.AppProperties;
import com.sysnest.admin.modules.auth.dto.LoginDto;
import com.sysnest.admin.modules.auth.vo.LoginVo;
import com.sysnest.admin.modules.captcha.service.CaptchaService;
import com.sysnest.admin.modules.config.service.SysConfigService;
import com.sysnest.admin.modules.log.service.LoginLogService;
import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.mapper.MenuMapper;
import com.sysnest.admin.modules.online.service.OnlineUserService;
import com.sysnest.admin.modules.role.mapper.RoleMapper;
import com.sysnest.admin.modules.user.entity.User;
import com.sysnest.admin.modules.user.mapper.UserMapper;
import com.sysnest.admin.security.JwtTokenProvider;
import com.sysnest.admin.security.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 登录流程单元测试：用户不存在、密码错误、账号禁用、登录成功
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserMapper userMapper;
    @Mock
    private RoleMapper roleMapper;
    @Mock
    private MenuMapper menuMapper;
    @Mock
    private SysConfigService sysConfigService;
    @Mock
    private CaptchaService captchaService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private TokenBlacklistService tokenBlacklistService;
    @Mock
    private RedisUtils redisUtils;
    @Mock
    private AuthCacheService authCacheService;
    @Mock
    private OnlineUserService onlineUserService;
    @Mock
    private LoginLogService loginLogService;

    private AuthService authService;

    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.setAdmin("admin");
        authService = new AuthService(
                userMapper, roleMapper, menuMapper, sysConfigService, captchaService,
                passwordEncoder, jwtTokenProvider, tokenBlacklistService, redisUtils,
                authCacheService, onlineUserService, loginLogService, appProperties);
    }

    @Test
    void userNotFoundThrows1001AndRecordsFailure() {
        mockLoginConfig();
        when(userMapper.selectOne(any())).thenReturn(null);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(loginDto("admin", "123456"), null));

        assertEquals(ErrorCode.USER_NOT_FOUND.getCode(), exception.getCode());
        verify(loginLogService).record(eq("admin"), any(), eq(false), eq("用户不存在"));
    }

    @Test
    void wrongPasswordThrows1002AndCountsRetry() {
        mockLoginConfig();
        when(userMapper.selectOne(any())).thenReturn(user("1"));
        when(passwordEncoder.matches("bad", "encoded")).thenReturn(false);
        when(redisUtils.increment(anyString(), eq(1L), any())).thenReturn(1L);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(loginDto("admin", "bad"), null));

        assertEquals(ErrorCode.USER_PASSWORD_ERROR.getCode(), exception.getCode());
        verify(redisUtils).increment(anyString(), eq(1L), any());
    }

    @Test
    void disabledUserThrows1003() {
        mockLoginConfig();
        when(userMapper.selectOne(any())).thenReturn(user("0"));
        when(passwordEncoder.matches("123456", "encoded")).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(loginDto("admin", "123456"), null));

        assertEquals(ErrorCode.USER_DISABLED.getCode(), exception.getCode());
    }

    @Test
    void successReturnsTokensAndWritesCaches() {
        mockLoginConfig();
        User user = user("1");
        when(userMapper.selectOne(any())).thenReturn(user);
        when(passwordEncoder.matches("123456", "encoded")).thenReturn(true);
        when(roleMapper.selectByUserId(1)).thenReturn(List.of());
        Menu menu = new Menu();
        menu.setPerms("system:user:list");
        when(menuMapper.selectList(any())).thenReturn(List.of(menu));
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        LoginVo loginVo = authService.login(loginDto("admin", "123456"), null);

        assertEquals("access-token", loginVo.getAccessToken());
        assertEquals("refresh-token", loginVo.getRefreshToken());
        verify(authCacheService).put(any());
        verify(onlineUserService).save(eq("access-token"), eq(user), any());
        verify(loginLogService).record(eq("admin"), any(), eq(true), eq("登录成功"));
    }

    private void mockLoginConfig() {
        when(sysConfigService.getValue("sys.login.captchaEnabled")).thenReturn("false");
        when(sysConfigService.getIntValue("sys.login.maxRetryCount", 5)).thenReturn(5);
        when(sysConfigService.getIntValue("sys.login.lockTime", 10)).thenReturn(10);
    }

    private LoginDto loginDto(String username, String password) {
        LoginDto dto = new LoginDto();
        dto.setUsername(username);
        dto.setPassword(password);
        return dto;
    }

    private User user(String status) {
        User user = new User();
        user.setId(1);
        user.setUsername("admin");
        user.setNickname("超级管理员");
        user.setPassword("encoded");
        user.setStatus(status);
        return user;
    }
}
