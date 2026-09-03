<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'customer',
    labelKey: 'page.dataManage.basic.customer.title',
    load: () => import('@/components/MasterData/archives/basic/customer/index.vue')
  },
  {
    key: 'supplier',
    labelKey: 'page.dataManage.basic.supplier.title',
    load: () => import('@/components/MasterData/archives/basic/supplier/index.vue')
  },
  {
    key: 'goods',
    labelKey: 'page.dataManage.basic.goods.title',
    load: () => import('@/components/MasterData/archives/basic/goods/index.vue')
  },
  {
    key: 'category',
    labelKey: 'page.dataManage.basic.category.title',
    load: () => import('@/components/MasterData/archives/basic/category/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
