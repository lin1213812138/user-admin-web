<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'countryRegion',
    labelKey: 'page.dataManage.basic.countryRegion.title',
    load: () => import('@/components/MasterData/archives/basic/country-region/index.vue')
  },
  {
    key: 'postalRoute',
    labelKey: 'page.dataManage.basic.postalRoute.title',
    load: () => import('@/components/MasterData/archives/basic/postal-route/index.vue')
  },
  {
    key: 'fbaWarehouse',
    labelKey: 'page.dataManage.basic.fbaWarehouse.title',
    load: () => import('@/components/MasterData/archives/basic/fba-warehouse/index.vue')
  },
  {
    key: 'customerLevel',
    labelKey: 'page.dataManage.basic.customerLevel.title',
    load: () => import('@/components/MasterData/archives/basic/customer-level/index.vue')
  },
  {
    key: 'customerSource',
    labelKey: 'page.dataManage.basic.customerSource.title',
    load: () => import('@/components/MasterData/archives/basic/customer-source/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
