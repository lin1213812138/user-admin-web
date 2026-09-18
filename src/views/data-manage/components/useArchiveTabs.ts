import { computed, defineAsyncComponent, h, ref } from 'vue';
import type { Component } from 'vue';
import { NEmpty, NSpin } from 'naive-ui';
import { $t } from '@/locales';
import { useAuth } from '@/hooks/business/auth';
import type { ArchiveTabItem } from './types';

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
 */
export function useArchiveTabs(items: ArchiveTabItem[]) {
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

  return { tabs, activeKey, activeComponent };
}
