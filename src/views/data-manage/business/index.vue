<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref, type Component } from 'vue';
import { NSpin } from 'naive-ui';
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import type { ArchiveTabItem } from '@/views/data-manage/components/types';

/** 本组资料项（懒加载子档案）：左侧竖向 tab 与右侧内容均由它驱动 */
const items: ArchiveTabItem[] = [
  {
    key: 'address',
    labelKey: 'page.dataManage.business.address.title',
    load: () => import('@/views/data-manage/business/modules/address/Address.vue')
  },
  {
    key: 'declaredGoods',
    labelKey: 'page.dataManage.business.declaredGoods.title',
    load: () => import('@/views/data-manage/business/modules/declared-goods/DeclaredGoods.vue')
  },
  {
    key: 'problemCategory',
    labelKey: 'page.dataManage.business.problemCategory.title',
    load: () => import('@/views/data-manage/business/modules/problem-category/ProblemCategory.vue')
  },
  {
    key: 'goodsCategory',
    labelKey: 'page.dataManage.business.goodsCategory.title',
    load: () => import('@/views/data-manage/business/modules/goods-category/GoodsCategory.vue')
  },
  {
    key: 'customsType',
    labelKey: 'page.dataManage.business.customsType.title',
    load: () => import('@/views/data-manage/business/modules/customs-type/CustomsType.vue')
  },
  {
    key: 'exportReason',
    labelKey: 'page.dataManage.business.exportReason.title',
    load: () => import('@/views/data-manage/business/modules/export-reason/ExportReason.vue')
  },
  {
    key: 'clearanceMethod',
    labelKey: 'page.dataManage.business.clearanceMethod.title',
    load: () => import('@/views/data-manage/business/modules/clearance-method/ClearanceMethod.vue')
  },
  {
    key: 'salesTerms',
    labelKey: 'page.dataManage.business.salesTerms.title',
    load: () => import('@/views/data-manage/business/modules/sales-terms/SalesTerms.vue')
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
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_business')">
    <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
  </VerticalTabLayout>
</template>
