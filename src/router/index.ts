import type { App } from 'vue';
import {
  type RouterHistory,
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { createBuiltinVueRoutes } from './routes/builtin';
import { createRouterGuard } from './guard';

const { VITE_ROUTER_HISTORY_MODE = 'history', VITE_BASE_URL } = import.meta.env;

const historyCreatorMap: Record<Env.RouterHistoryMode, (base?: string) => RouterHistory> = {
  hash: createWebHashHistory,
  history: createWebHistory,
  memory: createMemoryHistory
};

export const router = createRouter({
  history: historyCreatorMap[VITE_ROUTER_HISTORY_MODE](VITE_BASE_URL),
  routes: createBuiltinVueRoutes()
});

/**
 * 仅开发环境的组件示例页（/handsontable-demo）。
 *
 * 页面位于 `src/components/common/handsontable/`，被 elegant-router 的 pageExcludePatterns
 * （`**\/components/**`）排除，因此不会生成正式路由、不进菜单、不参与权限过滤；
 * 这里用裸路由手工挂载，且整段被 `import.meta.env.DEV` 守卫——生产构建会被死代码消除，
 * 示例页与 handsontable 依赖不会进入产物。
 */
if (import.meta.env.DEV) {
  router.addRoute({
    name: 'handsontable-demo',
    path: '/handsontable-demo',
    component: () => import('@/components/common/handsontable/handson-table-demo.vue'),
    meta: {
      title: 'Handsontable Demo',
      constant: true
    }
  });
}

/** Setup Vue Router */
export async function setupRouter(app: App) {
  app.use(router);
  createRouterGuard(router);
  await router.isReady();
}
