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

      /** 只在业务页面内跳转进入、不出现在菜单里的路由 */
      const hideInMenuRoutes: RouteKey[] = ['system-manage_print-design'];

      /** menu icon of the route */
      const routeIcons: Partial<Record<RouteKey, string>> = {
        'system-manage': 'ic:baseline-settings',
        'system-manage_role': 'ic:round-supervisor-account',
        'system-manage_user': 'ic:round-person',
        'system-manage_setting': 'ic:baseline-settings-applications',
        'data-manage': 'ic:baseline-folder',
        'data-manage_basic': 'ic:baseline-inventory',
        'data-manage_finance': 'ic:baseline-account-balance-wallet',
        'data-manage_business': 'ic:baseline-warehouse',
        'system-manage_label-designer': 'ic:round-label'
      };

      /** menu order of the route, the smaller the value, the higher the order */
      const routeOrders: Partial<Record<RouteKey, number>> = {
        home: 0,
        'data-manage': 1,
        'system-manage': 2,
        'system-manage_role': 1,
        'system-manage_user': 2,
        'system-manage_menu': 3,
        'system-manage_setting': 4,
        'system-manage_label-designer': 5
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
