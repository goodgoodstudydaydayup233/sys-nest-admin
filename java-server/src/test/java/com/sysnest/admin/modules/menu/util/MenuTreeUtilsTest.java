package com.sysnest.admin.modules.menu.util;

import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.vo.RouterVo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 动态路由构建单元测试：对应 Nest 的 build-menus.ts
 */
class MenuTreeUtilsTest {

    @Test
    void directoryAndChildMenu() {
        Menu directory = menu(1, 0, "M", "/system", null, "1");
        Menu page = menu(2, 1, "C", "user", "system/user/index", "1");

        List<RouterVo> routers = MenuTreeUtils.build(List.of(directory, page));

        assertEquals(1, routers.size());
        RouterVo system = routers.get(0);
        assertEquals("/system", system.getPath());
        assertEquals("Layout", system.getComponent());
        assertTrue(system.getAlwaysShow());
        assertEquals("noRedirect", system.getRedirect());
        assertEquals("system/user/index", system.getChildren().get(0).getComponent());
    }

    @Test
    void innerLinkUnderDirectoryUsesInnerLinkComponent() {
        Menu directory = menu(4, 0, "M", "/tool", null, "1");
        Menu link = menu(80, 4, "C", "http://localhost:3100/api", null, "0");

        List<RouterVo> routers = MenuTreeUtils.build(List.of(directory, link));

        RouterVo inner = routers.get(0).getChildren().get(0);
        assertEquals("localhost/3100/api", inner.getPath());
        assertEquals("InnerLink", inner.getComponent());
        assertEquals("http://localhost:3100/api", inner.getMeta().getLink());
        assertEquals("http://localhost:3100/api", inner.getMeta().getPath());
    }

    @Test
    void topLevelExternalLinkWrappedByLayout() {
        Menu link = menu(90, 0, "C", "https://example.com/doc", null, "0");

        List<RouterVo> routers = MenuTreeUtils.build(List.of(link));

        RouterVo wrapper = routers.get(0);
        assertEquals("/", wrapper.getPath());
        assertEquals("Layout", wrapper.getComponent());
        RouterVo inner = wrapper.getChildren().get(0);
        assertEquals("InnerLink", inner.getComponent());
        assertEquals("example/com/doc", inner.getPath());
        assertNotNull(inner.getMeta().getLink());
    }

    @Test
    void topLevelSingleMenuWrappedByLayout() {
        Menu page = menu(100, 0, "C", "dashboard", "dashboard/index", "1");

        List<RouterVo> routers = MenuTreeUtils.build(List.of(page));

        RouterVo wrapper = routers.get(0);
        assertEquals("/", wrapper.getPath());
        assertEquals("dashboard/index", wrapper.getChildren().get(0).getComponent());
    }

    private Menu menu(int id, int parentId, String type, String path, String component, String isFrame) {
        Menu menu = new Menu();
        menu.setId(id);
        menu.setParentId(parentId);
        menu.setMenuName("菜单" + id);
        menu.setMenuType(type);
        menu.setPath(path);
        menu.setComponent(component);
        menu.setIsFrame(isFrame);
        menu.setIsCache("0");
        menu.setVisible("0");
        menu.setOrderNum(0);
        return menu;
    }
}
