import type { CustomRoute, ElegantConstRoute, ElegantRoute, GeneratedRoute } from '@elegant-router/types';
import type { RouteComponent } from 'vue-router';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views as elegantViews } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * 内嵌页视图：页面位于 `views/**\/modules/**`，不参与 elegant-router 扫描
 * （见 `build/plugins/router.ts` 的 pageExcludePatterns —— 扫描会把父级页面顶成容器路由），
 * 在下方手工注册路由后，需在这里补挂视图，transform 才能解析到页面组件。
 */
const embeddedViews: Record<string, () => Promise<RouteComponent>> = {
  'channel-quote_receive_quote-setting': () => import('@/views/channel-quote/receive/modules/quote-setting/index.vue')
};

/**
 * 报价设置（收货渠道的内嵌子页）。
 *
 * 必须作为 `channel-quote` 的**子路由**注入（见下方 `injectQuoteSettingRoute`），不能写成顶层 custom route：
 * transform 里 `layout.base$view.xxx` 的组合写法只对「一级单级路由」（name 不含 `_`）生效，
 * 三段 name 的顶层路由会被当成普通路由去 `layouts` 里找 `base$view.xxx` 而抛
 * `Layout component "base$view.xxx" not found`，且会丢掉「收货渠道」的父子层级。
 *
 * 菜单表现：`hideInMenu` 让菜单不出现该项，`activeMenu` 让打开时仍高亮「收货渠道」。
 * routeName / routePath 同时声明在 `build/plugins/router.ts` 的 customRoutes.map（RouteKey / routeMap 随之生成）。
 */
const QUOTE_SETTING_ROUTE: ElegantConstRoute = {
  name: 'channel-quote_receive_quote-setting',
  path: '/channel-quote/receive/quote-setting',
  component: 'view.channel-quote_receive_quote-setting',
  meta: {
    title: 'channel-quote_receive_quote-setting',
    i18nKey: 'route.channel-quote_receive_quote-setting',
    hideInMenu: true,
    activeMenu: 'channel-quote_receive',
    keepAlive: true
  }
};

/** 把报价设置注入「渠道报价」的子路由（幂等：重新生成后仍是同一份数据，不会重复插入） */
function injectQuoteSettingRoute(routes: GeneratedRoute[]): GeneratedRoute[] {
  return routes.map(route => {
    if (route.name !== 'channel-quote' || !('children' in route) || !route.children) {
      return route;
    }

    if (route.children.some(child => child.name === QUOTE_SETTING_ROUTE.name)) {
      return route;
    }

    // children 的静态类型只覆盖由目录扫描得出的 key，内嵌页这一项在此放宽
    return { ...route, children: [...route.children, QUOTE_SETTING_ROUTE] } as GeneratedRoute;
  });
}

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...injectQuoteSettingRoute(generatedRoutes)].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  // 合并「自动生成的 views + 内嵌页视图」必须放在调用时：
  // imports.ts 经 layouts 与路由模块构成循环依赖，模块顶层展开 elegantViews 会命中 TDZ
  // （Cannot access 'elegantViews' before initialization）
  const views: Record<string, RouteComponent | (() => Promise<RouteComponent>)> = {
    ...elegantViews,
    ...embeddedViews
  };

  return transformElegantRoutesToVueRoutes(routes, layouts, views);
}
