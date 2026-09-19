import { computed, defineAsyncComponent, h, ref, watch } from 'vue';
import type { Component } from 'vue';
import { NEmpty, NSpin } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useAuth } from '@/hooks/business/auth';
import { useTabStore } from '@/store/modules/tab';
import type { ArchiveTabItem, ArchiveTabsOptions } from './types';

/** 分包加载中的占位 */
const loadingComponent: Component = () =>
  h('div', { class: 'flex h-full w-full items-center justify-center' }, [h(NSpin)]);

/** 角色未勾选任何子模块权限时的占位 */
const noPermissionComponent: Component = () =>
  h('div', { class: 'flex h-full w-full items-center justify-center' }, [h(NEmpty)]);

/**
 * 资料档案组的子模块 tab：
 * - 按 `ArchiveTabItem.permission` 过滤（权限码与 menu-permissions.ts 配置一致；
 *   未配置 permission 的 tab 不受控，恒显示）
 * - 超管（roleType===100）由 useAuth().hasAuth 直通
 * - 全部无权限时右侧渲染 NEmpty 占位，tab/组件不会渲染越权子模块
 * - `options.urlSync` 开启时，分页状态与 URL（?tab=xxx）双向同步
 */
export function useArchiveTabs(items: ArchiveTabItem[], options: ArchiveTabsOptions = {}) {
  const { hasAuth } = useAuth();

  const visibleItems = items.filter(item => !item.permission || hasAuth(item.permission));

  /** 左侧竖向 tab（labelKey → 当前语言文案） */
  const tabs = visibleItems.map(item => ({ value: item.key, label: $t(item.labelKey) }));

  /** 每个子模块一个异步组件：key 不同即组件不同，切 tab 时自动重建并重新取数 */
  const asyncComps: Record<string, Component> = {};
  for (const item of visibleItems) {
    if (item.component) {
      asyncComps[item.key] = item.component;
    } else if (item.load) {
      asyncComps[item.key] = defineAsyncComponent({ loader: item.load, loadingComponent });
    }
  }

  const activeKey = ref(visibleItems[0]?.key ?? '');
  const activeComponent = computed<Component>(() => asyncComps[activeKey.value] ?? noPermissionComponent);

  if (options.urlSync) {
    const route = useRoute();
    const router = useRouter();
    const tabStore = useTabStore();

    /** 本页路径：keep-alive 缓存期间其他页面的 query 变化不应影响本页的 activeKey */
    const selfPath = route.path;

    /** query 里的 tab 是否对当前用户可见（存在且有权限），无效值返回 null 一律忽略 */
    function resolveVisibleTabKey(raw: unknown): string | null {
      return typeof raw === 'string' && tabs.some(t => t.value === raw) ? raw : null;
    }

    /** URL → activeKey：初始进入 / 浏览器前进后退 / 外部跳转 均走这里 */
    function syncFromQuery() {
      if (route.path !== selfPath) return;

      const key = resolveVisibleTabKey(route.query.tab);
      if (key && key !== activeKey.value) {
        activeKey.value = key;
      }
    }

    /**
     * activeKey → URL：
     * - `replace` 不新增浏览器历史，后退仍直接离开本页
     * - 同步全局页签记录的 fullPath，否则点顶部页签切回会跳回旧 query、丢失最后所在分页
     */
    function syncToQuery() {
      if (route.query.tab === activeKey.value) return;

      const query = { ...route.query, tab: activeKey.value };
      const { fullPath } = router.resolve({ path: route.path, query });

      tabStore.setTabFullPath(tabStore.getTabIdByRoute(route), fullPath);

      void router.replace({ path: route.path, query });
    }

    syncFromQuery();
    watch(activeKey, syncToQuery);
    watch(() => route.query.tab, syncFromQuery);
  }

  return { tabs, activeKey, activeComponent };
}
