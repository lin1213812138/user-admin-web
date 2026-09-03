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

      /** menu icon of the route */
      const routeIcons: Partial<Record<RouteKey, string>> = {
        'system-manage': 'ic:baseline-settings',
        'system-manage_role': 'ic:round-supervisor-account',
        'system-manage_user': 'ic:round-person',
        'data-manage': 'ic:baseline-folder',
        'data-manage_basic': 'ic:baseline-inventory',
        'data-manage_finance': 'ic:baseline-account-balance-wallet',
        'data-manage_business': 'ic:baseline-warehouse'
      };

      /** menu order of the route, the smaller the value, the higher the order */
      const routeOrders: Partial<Record<RouteKey, number>> = {
        home: 0,
        'data-manage': 1,
        'system-manage': 2,
        'system-manage_role': 1,
        'system-manage_user': 2
      };

      const meta: Partial<RouteMeta> = {
        title: key,
        i18nKey: `route.${key}` as App.I18n.I18nKey
      };

      if (constantRoutes.includes(key)) {
        meta.constant = true;
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
