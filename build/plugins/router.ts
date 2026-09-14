import type { RouteMeta } from 'vue-router';
import ElegantVueRouter from '@elegant-router/vue/vite';
import type { RouteKey } from '@elegant-router/types';

export function setupElegantRouter() {
  return ElegantVueRouter({
    layouts: {
      base: 'src/layouts/base-layout/index.vue',
      blank: 'src/layouts/blank-layout/index.vue'
    },
    routePathTransformer(routeName, routePath) {
      const key = routeName as RouteKey;

      if (key === 'login') {
        const modules: UnionKey.LoginModule[] = ['pwd-login', 'code-login', 'register', 'reset-pwd', 'bind-wechat'];

        const moduleReg = modules.join('|');

        return `/login/:module(${moduleReg})?`;
      }

      return routePath;
    },
    onRouteMetaGen(routeName) {
      const key = routeName as RouteKey;

      const constantRoutes: RouteKey[] = ['login', '403', '404', '500'];

      /** 只在业务页面内跳转进入、不出现在菜单里的路由（标签设计器由「系统设置 → 打印格式 → 设计」进入） */
      const hideInMenuRoutes: RouteKey[] = ['system-manage_print-design', 'system-manage_label-designer'];

      /** 不在菜单里、但需要点亮其它菜单项的路由（菜单选中 = hideInMenu ? activeMenu : name） */
      const menuActiveKeys: Partial<Record<RouteKey, RouteKey>> = {
        'system-manage_label-designer': 'system-manage_setting'
      };

      /** menu icon of the route */
      const routeIcons: Partial<Record<RouteKey, string>> = {
        'system-manage': 'ic:baseline-settings',
        'system-manage_site': 'ic:round-place',
        'permission-manage': 'ic:round-lock',
        'permission-manage_user': 'ic:round-person',
        'permission-manage_role': 'ic:round-supervisor-account',
        'permission-manage_menu': 'ic:baseline-menu',
        'system-manage_group': 'ic:round-groups',
        'system-manage_customer': 'ic:round-business',
        'system-manage_setting': 'ic:baseline-settings-applications',
        'data-manage': 'ic:baseline-folder',
        'data-manage_basic': 'ic:baseline-inventory',
        'data-manage_finance': 'ic:baseline-account-balance-wallet',
        'data-manage_business': 'ic:baseline-warehouse',
        // 该路由已 hideInMenu，图标/排序暂时无展示效果，保留以便日后重新开放菜单入口
        'system-manage_label-designer': 'ic:round-label'
      };

      /** menu order of the route, the smaller the value, the higher the order */
      const routeOrders: Partial<Record<RouteKey, number>> = {
        home: 0,
        'data-manage': 1,
        'system-manage': 2,
        // 权限管理模块
        'permission-manage': 3,
        'permission-manage_user': 1,
        'permission-manage_role': 2,
        'permission-manage_menu': 3,
        'system-manage_setting': 7,
        'system-manage_site': 4,
        'system-manage_group': 5,
        'system-manage_customer': 6,
        // 同图标：hideInMenu 后排序无展示效果，保留以便日后重新开放菜单入口
        'system-manage_label-designer': 6
      };

      const meta: Partial<RouteMeta> = {
        title: key,
        i18nKey: `route.${key}` as App.I18n.I18nKey
      };

      if (constantRoutes.includes(key)) {
        meta.constant = true;
      }

      if (hideInMenuRoutes.includes(key)) {
        meta.hideInMenu = true;
      }

      const activeMenuKey = menuActiveKeys[key];

      if (activeMenuKey) {
        meta.activeMenu = activeMenuKey;
      }

      if (routeIcons[key]) {
        meta.icon = routeIcons[key];
      }

      if (routeOrders[key] !== undefined) {
        meta.order = routeOrders[key];
      }

      return meta;
    }
  });
}
