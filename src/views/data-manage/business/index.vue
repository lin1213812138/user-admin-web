<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 本组资料项（懒加载子档案）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs(
  [
    {
      key: 'address',
      labelKey: 'page.dataManage.business.address.title',
      permission: 'system:dataBusiness:address',
      load: () => import('@/views/data-manage/business/modules/address/index.vue')
    },
    {
      key: 'declaredGoods',
      labelKey: 'page.dataManage.business.declaredGoods.title',
      permission: 'system:dataBusiness:declaredGoods',
      load: () => import('@/views/data-manage/business/modules/declared-goods/index.vue')
    },
    {
      key: 'problemCategory',
      labelKey: 'page.dataManage.business.problemCategory.title',
      permission: 'system:dataBusiness:problemCategory',
      load: () => import('@/views/data-manage/business/modules/problem-category/index.vue')
    },
    {
      key: 'goodsCategory',
      labelKey: 'page.dataManage.business.goodsCategory.title',
      permission: 'system:dataBusiness:goodsCategory',
      load: () => import('@/views/data-manage/business/modules/goods-category/index.vue')
    },
    {
      key: 'customsType',
      labelKey: 'page.dataManage.business.customsType.title',
      permission: 'system:dataBusiness:customsType',
      load: () => import('@/views/data-manage/business/modules/customs-type/index.vue')
    },
    {
      key: 'exportReason',
      labelKey: 'page.dataManage.business.exportReason.title',
      permission: 'system:dataBusiness:exportReason',
      load: () => import('@/views/data-manage/business/modules/export-reason/index.vue')
    },
    {
      key: 'clearanceMethod',
      labelKey: 'page.dataManage.business.clearanceMethod.title',
      permission: 'system:dataBusiness:clearanceMethod',
      load: () => import('@/views/data-manage/business/modules/clearance-method/index.vue')
    },
    {
      key: 'salesTerms',
      labelKey: 'page.dataManage.business.salesTerms.title',
      permission: 'system:dataBusiness:salesTerms',
      load: () => import('@/views/data-manage/business/modules/sales-terms/index.vue')
    }
  ],
  { urlSync: true }
);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_business')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
