<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref, type Component } from 'vue';
import { NSpin } from 'naive-ui';
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import type { ArchiveTabItem } from '@/views/data-manage/components/types';

/** 提单资料六项（懒加载子档案）：左侧竖向 tab 与右侧内容均由它驱动 */
const items: ArchiveTabItem[] = [
  {
    key: 'blRoute',
    labelKey: 'page.dataManage.bl.blRoute.title',
    load: () => import('@/views/data-manage/bl/modules/bl-route/BlRoute.vue')
  },
  {
    key: 'blPort',
    labelKey: 'page.dataManage.bl.blPort.title',
    load: () => import('@/views/data-manage/bl/modules/bl-port/BlPort.vue')
  },
  {
    key: 'blTrip',
    labelKey: 'page.dataManage.bl.blTrip.title',
    load: () => import('@/views/data-manage/bl/modules/bl-trip/BlTrip.vue')
  },
  {
    key: 'blAddress',
    labelKey: 'page.dataManage.bl.blAddress.title',
    load: () => import('@/views/data-manage/bl/modules/bl-address/BlAddress.vue')
  },
  {
    key: 'blUnit',
    labelKey: 'page.dataManage.bl.blUnit.title',
    load: () => import('@/views/data-manage/bl/modules/bl-unit/BlUnit.vue')
  },
  {
    key: 'trackConfig',
    labelKey: 'page.dataManage.bl.trackConfig.title',
    load: () => import('@/views/data-manage/bl/modules/track-config/TrackConfig.vue')
  }
];

/** 左侧竖向 tab（labelKey → 当前语言文案） */
const tabs = items.map(item => ({ value: item.key, label: $t(item.labelKey) }));

/** 分包加载中的占位 */
const loadingComponent: Component = () =>
  h('div', { class: 'flex h-full w-full items-center justify-center' }, [h(NSpin)]);

/** 每个资料项一个异步组件：key 不同即组件不同，切 tab 时自动重建并重新取数 */
const asyncComps: Record<string, Component> = {};
for (const item of items) {
  asyncComps[item.key] = defineAsyncComponent({ loader: item.load, loadingComponent });
}

const activeKey = ref(items[0]?.key ?? '');
const activeComponent = computed(() => asyncComps[activeKey.value]);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_bl')">
    <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
  </VerticalTabLayout>
</template>
