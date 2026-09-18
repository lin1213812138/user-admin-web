<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 本组资料项（懒加载子档案）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs([
  {
    key: 'countryRegion',
    labelKey: 'page.dataManage.basic.countryRegion.title',
    permission: 'system:dataGeneral:countryRegion',
    load: () => import('@/views/data-manage/basic/modules/country-region/CountryRegion.vue')
  },
  {
    key: 'fbaWarehouse',
    labelKey: 'page.dataManage.basic.fbaWarehouse.title',
    permission: 'system:dataGeneral:fbaWarehouse',
    load: () => import('@/views/data-manage/basic/modules/fba-warehouse/FbaWarehouse.vue')
  }
]);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_basic')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
