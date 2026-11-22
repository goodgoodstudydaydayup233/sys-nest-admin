package com.sysnest.admin.modules.menu.util;

import com.sysnest.admin.modules.menu.entity.Menu;
import com.sysnest.admin.modules.menu.vo.MenuTreeVo;
import com.sysnest.admin.modules.menu.vo.MetaVo;
import com.sysnest.admin.modules.menu.vo.RouterVo;
import org.springframework.beans.BeanUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 菜单树构建工具，相当于 Nest 的 common/utils/build-menus.ts
 * 只处理目录(M)和菜单(C)，按钮(F)不会进入路由
 */
public final class MenuTreeUtils {

    private MenuTreeUtils() {
    }

    public static List<RouterVo> build(List<Menu> menus) {
        // 路由树不包含按钮
        List<Menu> routeMenus = menus.stream()
                .filter(menu -> !"F".equals(menu.getMenuType()))
                .toList();
        return buildLevel(0, groupByParent(routeMenus), true);
    }

    /**
     * 菜单管理页使用的树结构（叶子节点 children 为空数组）
     */
    public static List<MenuTreeVo> buildMenuTree(List<Menu> menus) {
        Map<Integer, List<Menu>> childrenMap = groupByParent(menus);
        return buildMenuLevel(0, childrenMap);
    }

    private static Map<Integer, List<Menu>> groupByParent(List<Menu> menus) {
        Map<Integer, List<Menu>> childrenMap = new LinkedHashMap<>();
        menus.stream()
                .sorted(Comparator.comparing(Menu::getOrderNum, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(Menu::getId))
                .forEach(menu -> childrenMap
                        .computeIfAbsent(menu.getParentId() == null ? 0 : menu.getParentId(), key -> new ArrayList<>())
                        .add(menu));
        return childrenMap;
    }

    private static List<MenuTreeVo> buildMenuLevel(int parentId, Map<Integer, List<Menu>> childrenMap) {
        List<MenuTreeVo> result = new ArrayList<>();
        for (Menu menu : childrenMap.getOrDefault(parentId, List.of())) {
            MenuTreeVo vo = new MenuTreeVo();
            BeanUtils.copyProperties(menu, vo);
            vo.setChildren(buildMenuLevel(menu.getId(), childrenMap));
            result.add(vo);
        }
        return result;
    }

    private static List<RouterVo> buildLevel(int parentId, Map<Integer, List<Menu>> childrenMap, boolean topLevel) {
        List<Menu> levelMenus = childrenMap.getOrDefault(parentId, List.of());
        List<RouterVo> routers = new ArrayList<>();
        for (Menu menu : levelMenus) {
            routers.add(toRouter(menu, childrenMap, topLevel));
        }
        return routers;
    }

    private static RouterVo toRouter(Menu menu, Map<Integer, List<Menu>> childrenMap, boolean topLevel) {
        List<RouterVo> children = buildLevel(menu.getId(), childrenMap, false);
        boolean directory = "M".equals(menu.getMenuType());
        boolean menuFrame = isMenuFrame(menu);
        boolean innerLink = isInnerLink(menu);

        // 顶层单页菜单：外面套一层 Layout，真正页面作为唯一子路由
        if (topLevel && !directory) {
            if (innerLink) {
                return topLevelExternalRouter(menu);
            }
            RouterVo wrapper = new RouterVo();
            wrapper.setPath("/");
            wrapper.setName("");
            wrapper.setHidden(isHidden(menu));
            wrapper.setChildren(List.of(pageRouter(menu, children)));
            return wrapper;
        }

        RouterVo router = new RouterVo();
        router.setHidden(isHidden(menu));
        router.setPath(routePath(menu));
        router.setName(menuFrame ? "" : capitalize(stripSlash(menu.getPath())));
        router.setComponent(component(menu));
        router.setQuery(menu.getQuery() == null ? "" : menu.getQuery());
        MetaVo meta = buildMeta(menu);
        if (innerLink) {
            meta.setLink(menu.getPath());
            meta.setPath(menu.getPath());
        }
        router.setMeta(meta);
        router.setChildren(children);

        if (directory) {
            if (topLevel) {
                router.setComponent("Layout");
            }
            if (!children.isEmpty()) {
                router.setAlwaysShow(true);
                router.setRedirect("noRedirect");
            }
        } else if (menuFrame) {
            router.setMeta(null);
        }
        return router;
    }

    /**
     * 单页面菜单：返回真正带组件的路由节点
     */
    private static RouterVo pageRouter(Menu menu, List<RouterVo> children) {
        RouterVo router = new RouterVo();
        router.setHidden(isHidden(menu));
        router.setPath(menu.getPath());
        router.setName(capitalize(stripSlash(menu.getPath())));
        router.setComponent(menu.getComponent());
        router.setQuery(menu.getQuery() == null ? "" : menu.getQuery());
        router.setMeta(buildMeta(menu));
        router.setChildren(children);
        return router;
    }

    /**
     * 顶层外链：Layout 包一层，子路由用 InnerLink 内嵌
     * 与 Nest 的 build-menus 顶层外链分支保持一致
     */
    private static RouterVo topLevelExternalRouter(Menu menu) {
        RouterVo wrapper = new RouterVo();
        wrapper.setHidden(isHidden(menu));
        wrapper.setPath("/");
        wrapper.setComponent("Layout");
        wrapper.setMeta(new MetaVo(menu.getMenuName(), menu.getIcon(), null, null, null));

        MetaVo childMeta = buildMeta(menu);
        childMeta.setLink(menu.getPath());
        childMeta.setPath(menu.getPath());

        RouterVo inner = new RouterVo();
        inner.setPath(convertExternalPath(menu.getPath()));
        inner.setComponent("InnerLink");
        inner.setName(capitalize(menu.getMenuName()));
        inner.setMeta(childMeta);
        inner.setChildren(new ArrayList<>());
        wrapper.setChildren(List.of(inner));
        return wrapper;
    }

    private static String routePath(Menu menu) {
        String path = menu.getPath() == null ? "" : menu.getPath();
        Integer parentId = menu.getParentId() == null ? 0 : menu.getParentId();
        if (parentId != 0 && isInnerLink(menu)) {
            path = convertExternalPath(path);
        }
        if (parentId == 0 && "M".equals(menu.getMenuType()) && !"0".equals(menu.getIsFrame())) {
            return path.startsWith("/") ? path : "/" + path;
        }
        if (isMenuFrame(menu)) {
            return "/";
        }
        return path;
    }

    private static String component(Menu menu) {
        if (StringUtils.hasText(menu.getComponent()) && !isMenuFrame(menu)) {
            return menu.getComponent();
        }
        Integer parentId = menu.getParentId() == null ? 0 : menu.getParentId();
        if (!StringUtils.hasText(menu.getComponent()) && parentId != 0 && isInnerLink(menu)) {
            return "InnerLink";
        }
        if (!StringUtils.hasText(menu.getComponent()) && parentId != 0 && "M".equals(menu.getMenuType())) {
            return "ParentView";
        }
        return "Layout";
    }

    private static boolean isMenuFrame(Menu menu) {
        Integer parentId = menu.getParentId() == null ? 0 : menu.getParentId();
        return parentId == 0 && "C".equals(menu.getMenuType()) && !"0".equals(menu.getIsFrame());
    }

    private static boolean isInnerLink(Menu menu) {
        return "0".equals(menu.getIsFrame()) && isHttp(menu.getPath());
    }

    private static MetaVo buildMeta(Menu menu) {
        return new MetaVo(
                menu.getMenuName(),
                menu.getIcon(),
                "1".equals(menu.getIsCache()),
                null,
                null);
    }

    private static boolean isHidden(Menu menu) {
        return "1".equals(menu.getVisible());
    }

    private static boolean isHttp(String path) {
        return path != null && (path.startsWith("http://") || path.startsWith("https://"));
    }

    private static String convertExternalPath(String path) {
        return path.replace("http://", "")
                .replace("https://", "")
                .replace("www.", "")
                .replace(".", "/")
                .replace(":", "/");
    }

    private static String stripSlash(String path) {
        if (path == null) {
            return "";
        }
        return path.startsWith("/") ? path.substring(1) : path;
    }

    private static String capitalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
