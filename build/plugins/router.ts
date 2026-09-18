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

      /** 只在业务页面内跳转进入、不出现在菜单里的路由（标签设计器由「系统设置 → 打印格式 → 设计」进入；个人中心由侧栏底部下拉菜单进入） */
      const hideInMenuRoutes: RouteKey[] = [
        'system-manage_print-design',
        'system-manage_label-designer',
        'personal-center'
      ];

      /** 不在菜单里、但需要点亮其它菜单项的路由（菜单选中 = hideInMenu ? activeMenu : name） */
      const menuActiveKeys: Partial<Record<RouteKey, RouteKey>> = {
        'system-manage_label-designer': 'system-manage_setting'
      };

      /** menu icon of the route */
      const routeIcons: Partial<Record<RouteKey, string>> = {
        'system-manage': 'ic:baseline-settings',
        'system-manage_site': 'ic:round-place',
        'system-manage_user': 'ic:round-person',
        'system-manage_role': 'ic:round-supervisor-account',
        'system-manage_log': 'ic:round-article',
        'customer-manage': 'ic:round-business',
        'customer-manage_customer': 'ic:round-contacts',
        'system-manage_group': 'ic:round-groups',
        'system-manage_setting': 'ic:baseline-settings-applications',
        'data-manage': 'ic:baseline-folder',
        'data-manage_basic': 'ic:baseline-inventory',
        'data-manage_finance': 'ic:baseline-account-balance-wallet',
        'data-manage_business': 'ic:baseline-warehouse',
        'data-manage_no-rule': 'ic:round-numbers',
        'data-manage_ship': 'ic:baseline-local-shipping',
        'data-manage_bl': 'ic:baseline-receipt-long',
        'channel-quote': 'ic:baseline-sell',
        'channel-quote_receive': 'ic:baseline-move-to-inbox',
        'channel-quote_ship': 'ic:baseline-local-shipping',
        // 该路由已 hideInMenu，图标/排序暂时无展示效果，保留以便日后重新开放菜单入口
        'system-manage_label-designer': 'ic:round-label'
      };

      /** menu order of the route, the smaller the value, the higher the order */
      const routeOrders: Partial<Record<RouteKey, number>> = {
        // 一级菜单（系统管理与生成文件历史生效值对齐，客户管理追加在最后）
        home: 0,
        'customer-manage': 1,
        'channel-quote': 2,
        'data-manage': 3,
        'system-manage': 4,
        // 系统管理模块
        'system-manage_user': 1,
        'system-manage_role': 2,
        'system-manage_group': 3,
        'system-manage_site': 4,
        'system-manage_setting': 5,
        'system-manage_log': 6,
        // 客户管理模块
        'customer-manage_customer': 1,
        // 资料管理模块（显式排序：发货 → 单号 → 运单 → 财务 → 提单 → 通用）
        'data-manage_ship': 1,
        'data-manage_no-rule': 2,
        'data-manage_business': 3,
        'data-manage_finance': 4,
        'data-manage_bl': 5,
        'data-manage_basic': 6,
        // 同图标：hideInMenu 后排序无展示效果，保留以便日后重新开放菜单入口
        'system-manage_label-designer': 5
      };

      /** menu permission code for static-route auth (`system:{module}:list`).
       *  Keep in sync with the `permission` field of MENU_PERMISSION_TREE in src/constants/menu-permissions.ts.
       *  Leaf routes without a code are allowed by default (see filterAuthRoutesByPermission). */
      const routePermissions: Partial<Record<RouteKey, string>> = {
        'customer-manage_customer': 'system:customer:list',
        'channel-quote_receive': 'system:channelQuote:receive:list',
        'channel-quote_ship': 'system:channelQuote:ship:list',
        'data-manage_ship': 'system:ship:list',
        'data-manage_no-rule': 'system:noRule:list',
        'data-manage_business': 'system:business:list',
        'data-manage_finance': 'system:finance:list',
        'data-manage_bl': 'system:bl:list',
        'data-manage_basic': 'system:basic:list',
        'system-manage_user': 'system:user:list',
        'system-manage_role': 'system:role:list',
        'system-manage_group': 'system:group:list',
        'system-manage_site': 'system:site:list',
        'system-manage_setting': 'system:setting:list',
        'system-manage_log': 'system:log:list',
        // hideInMenu entries are still guarded against direct URL access
        'system-manage_print-design': 'system:printDesign:list',
        'system-manage_label-designer': 'system:labelDesign:list',
        'personal-center': 'system:personalCenter:list'
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

      if (routePermissions[key]) {
        meta.permission = routePermissions[key];
      }

      return meta;
    }
  });
}
