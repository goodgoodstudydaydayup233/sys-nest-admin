package com.sysnest.admin.modules;

import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.exception.GlobalExceptionHandler;
import com.sysnest.admin.modules.auth.controller.AuthController;
import com.sysnest.admin.modules.auth.service.AuthService;
import com.sysnest.admin.modules.auth.vo.LoginVo;
import com.sysnest.admin.modules.menu.controller.MenuController;
import com.sysnest.admin.modules.menu.service.MenuService;
import com.sysnest.admin.modules.menu.vo.MenuTreeVo;
import com.sysnest.admin.modules.role.controller.RoleController;
import com.sysnest.admin.modules.role.service.RoleService;
import com.sysnest.admin.modules.role.vo.RoleVo;
import com.sysnest.admin.modules.user.controller.UserController;
import com.sysnest.admin.modules.user.service.UserService;
import com.sysnest.admin.modules.user.vo.UserVo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 控制器接口 MockMvc 测试：认证、用户、角色、菜单
 * 使用 standalone 模式，只验证路由、参数校验和统一响应结构，不依赖数据库
 */
class ApiMockMvcTest {

    private AuthService authService;
    private UserService userService;
    private RoleService roleService;
    private MenuService menuService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = org.mockito.Mockito.mock(AuthService.class);
        userService = org.mockito.Mockito.mock(UserService.class);
        roleService = org.mockito.Mockito.mock(RoleService.class);
        menuService = org.mockito.Mockito.mock(MenuService.class);

        mockMvc = MockMvcBuilders.standaloneSetup(
                        new AuthController(authService),
                        new UserController(userService),
                        new RoleController(roleService),
                        new MenuController(menuService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void loginReturnsUnifiedResult() throws Exception {
        when(authService.login(any(), any())).thenReturn(new LoginVo("access-token", "refresh-token"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"));
    }

    @Test
    void loginValidationReturns400() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void userListReturnsPageResult() throws Exception {
        UserVo user = new UserVo();
        user.setId(1);
        user.setUsername("admin");
        when(userService.page(any())).thenReturn(PageResult.of(List.of(user), 1, 1, 10));

        mockMvc.perform(get("/user").param("page", "1").param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(10))
                .andExpect(jsonPath("$.data.list[0].username").value("admin"));
    }

    @Test
    void roleAllReturnsList() throws Exception {
        RoleVo role = new RoleVo();
        role.setId(1);
        role.setName("超级管理员");
        when(roleService.all()).thenReturn(List.of(role));

        mockMvc.perform(get("/role/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].name").value("超级管理员"));
    }

    @Test
    void menuTreeReturnsTree() throws Exception {
        MenuTreeVo menu = new MenuTreeVo();
        menu.setId(1);
        menu.setMenuName("系统管理");
        when(menuService.tree()).thenReturn(List.of(menu));

        mockMvc.perform(get("/menu/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].menuName").value("系统管理"));
    }
}
