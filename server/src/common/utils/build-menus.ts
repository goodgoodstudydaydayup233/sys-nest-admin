/** 菜单类型常量：目录 */
const TYPE_DIR = 'M';
/** 菜单类型常量：菜单 */
const TYPE_MENU = 'C';
/** 是外链 */
const YES_FRAME = '0';
/** 否（非外链） */
const NO_FRAME = '1';
const LAYOUT = 'Layout';
const PARENT_VIEW = 'ParentView';
const INNER_LINK = 'InnerLink';

/**
 * 菜单节点（build-menus 输入）
 * @description 对标 sys_menu 表结构，仅声明 build-menus 依赖的字段
 */
export interface MenuNode {
  id: number;
  parentId: number;
  menuName: string;
  path: string;
  component?: string;
  query?: string;
  isFrame: string;
  isCache: string;
  visible: string;
  menuType: string;
  icon?: string;
  link?: string;
  children?: MenuNode[];
}

/**
 * 路由 meta 信息（build-menus 输出）
 */
export interface RouteMeta {
  title?: string;
  icon?: string;
  noCache?: boolean;
  link?: string;
  path?: string;
}

/**
 * 构建出的路由对象（build-menus 输出）
 */
export interface RouteRecord {
  hidden?: boolean;
  name?: string;
  path: string;
  component?: string;
  query?: string;
  meta: RouteMeta | null;
  alwaysShow?: boolean;
  redirect?: string;
  children?: RouteRecord[];
}

const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * 判断字符串是否为有效 URL
 * @description class-validator 的 isURL 默认不认可 localhost/IP（无 TLD），
 * 此处放宽校验：以 http:// 或 https:// 开头即视为外链 URL。
 * @param str 待判断字符串
 * @returns 是否为 URL
 */
const isExternalUrl = (str: string): boolean => {
  if (!str) return false;
  return /^https?:\/\//.test(str);
};

const setMeta = (menu: MenuNode): RouteMeta => {
  const meta: RouteMeta = {
    title: menu.menuName,
    icon: menu.icon,
    noCache: menu.isCache === '1',
  };
  if (menu.link && isExternalUrl(menu.link)) {
    meta.link = menu.link;
  }
  // 外链：在 meta 中记录真实 URL，供 InnerLink 组件读取渲染 iframe
  if (isInnerLink(menu)) {
    meta.path = menu.path;
    meta.link = menu.path;
  }
  return meta;
};

const getRouteName = (menu: MenuNode): string => {
  let routerName = capitalize(menu.path);
  if (isMenuFrame(menu)) {
    routerName = '';
  }
  return routerName;
};

const isMenuFrame = (menu: MenuNode): boolean => {
  return menu.parentId === 0 && menu.menuType === TYPE_MENU && menu.isFrame === NO_FRAME;
};

/**
 * 判断是否为内嵌外链
 * @description 对标若依：isFrame='0'（是外链）且 path 为 URL 时，以 InnerLink 组件 iframe 内嵌展示。
 * 注意：YES_FRAME='0' 表示"是外链"，命名易混淆，但与若依常量定义一致。
 */
const isInnerLink = (menu: MenuNode): boolean => {
  return menu.isFrame === YES_FRAME && isExternalUrl(menu.path);
};

const isParentView = (menu: MenuNode): boolean => {
  return menu.parentId !== 0 && menu.menuType === TYPE_DIR;
};

const getComponent = (menu: MenuNode): string => {
  let component = LAYOUT;
  if (menu.component && !isMenuFrame(menu)) {
    component = menu.component;
  } else if (!menu.component && menu.parentId !== 0 && isInnerLink(menu)) {
    component = INNER_LINK;
  } else if (!menu.component && isParentView(menu)) {
    component = PARENT_VIEW;
  }
  return component;
};

const innerLinkReplaceEach = (path: string): string => {
  const replacements: [string, string][] = [
    ['http://', ''],
    ['https://', ''],
    ['www.', ''],
    ['.', '/'],
    [':', '/'],
  ];
  for (const [oldValue, newValue] of replacements) {
    path = path.split(oldValue).join(newValue);
  }
  return path;
};

const getRouterPath = (menu: MenuNode): string => {
  let routerPath = menu.path;
  if (menu.parentId !== 0 && isInnerLink(menu)) {
    routerPath = innerLinkReplaceEach(routerPath);
  }
  if (menu.parentId === 0 && menu.menuType === TYPE_DIR && menu.isFrame === NO_FRAME) {
    // 顶级目录：确保 path 以 / 开头，避免 vue-router 拼接出双斜杠
    routerPath = menu.path.startsWith('/') ? menu.path : '/' + menu.path;
  } else if (isMenuFrame(menu)) {
    routerPath = '/';
  }
  return routerPath;
};

const formatTreeNodeBuildMenus = (menus: MenuNode[]): RouteRecord[] => {
  return menus.map((menu) => {
    const router: RouteRecord = {
      path: '',
      meta: null,
    };
    router.hidden = menu.visible === '1';
    router.name = getRouteName(menu);
    router.path = getRouterPath(menu);
    router.component = getComponent(menu);
    router.query = menu.query || '';
    router.meta = setMeta(menu);

    if (menu.children && menu.children.length > 0 && menu.menuType === TYPE_DIR) {
      router.alwaysShow = true;
      router.redirect = 'noRedirect';
      router.children = formatTreeNodeBuildMenus(menu.children);
    } else if (isMenuFrame(menu)) {
      router.meta = null;
      const childrenList: RouteRecord[] = [];
      const childrenRouter: RouteRecord = {
        path: menu.path,
        component: menu.component,
        name: capitalize(menu.path),
        meta: setMeta(menu),
        query: menu.query || '',
      };
      childrenList.push(childrenRouter);
      router.children = childrenList;
    } else if (menu.parentId === 0 && isInnerLink(menu)) {
      // 顶级外链：用 Layout 包裹，子路由以 InnerLink 组件 iframe 内嵌展示（对标若依）
      router.meta = {
        title: menu.menuName,
        icon: menu.icon,
      };
      router.path = '/';
      const childrenList: RouteRecord[] = [];
      const childrenRouter: RouteRecord = {
        path: innerLinkReplaceEach(menu.path),
        component: INNER_LINK,
        name: capitalize(menu.menuName),
        meta: {
          title: menu.menuName,
          icon: menu.icon,
          link: menu.path,
          path: menu.path,
        },
      };
      childrenList.push(childrenRouter);
      router.children = childrenList;
    }

    return router;
  });
};

export const buildMenus = (menus: MenuNode[]): RouteRecord[] => {
  menus.sort((a, b) => a.parentId - b.parentId);
  const kData: Record<number, MenuNode> = {};
  const lData: MenuNode[] = [];
  menus.forEach((m) => {
    kData[m.id] = { ...m };
    if (m.parentId === 0) {
      lData.push(kData[m.id]);
    } else {
      kData[m.parentId] = kData[m.parentId] || ({} as MenuNode);
      kData[m.parentId].children = kData[m.parentId].children || [];
      kData[m.parentId].children!.push(kData[m.id]);
    }
  });
  return formatTreeNodeBuildMenus(lData);
};
