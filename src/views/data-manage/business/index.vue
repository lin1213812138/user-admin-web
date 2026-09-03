<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'warehouse',
    labelKey: 'page.dataManage.business.warehouse.title',
    load: () => import('@/components/MasterData/archives/business/warehouse/index.vue')
  },
  {
    key: 'location',
    labelKey: 'page.dataManage.business.location.title',
    load: () => import('@/components/MasterData/archives/business/location/index.vue')
  },
  {
    key: 'carrier',
    labelKey: 'page.dataManage.business.carrier.title',
    load: () => import('@/components/MasterData/archives/business/carrier/index.vue')
  },
  {
    key: 'store',
    labelKey: 'page.dataManage.business.store.title',
    load: () => import('@/components/MasterData/archives/business/store/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
