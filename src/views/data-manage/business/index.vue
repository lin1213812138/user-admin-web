<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'waybill',
    labelKey: 'page.dataManage.business.waybill.title',
    load: () => import('@/components/MasterData/archives/business/waybill/index.vue')
  },
  {
    key: 'address',
    labelKey: 'page.dataManage.business.address.title',
    load: () => import('@/components/MasterData/archives/business/address/index.vue')
  },
  {
    key: 'declaredGoods',
    labelKey: 'page.dataManage.business.declaredGoods.title',
    load: () => import('@/components/MasterData/archives/business/declared-goods/index.vue')
  },
  {
    key: 'problemCategory',
    labelKey: 'page.dataManage.business.problemCategory.title',
    load: () => import('@/components/MasterData/archives/business/problem-category/index.vue')
  },
  {
    key: 'goodsCategory',
    labelKey: 'page.dataManage.business.goodsCategory.title',
    load: () => import('@/components/MasterData/archives/business/goods-category/index.vue')
  },
  {
    key: 'customsType',
    labelKey: 'page.dataManage.business.customsType.title',
    load: () => import('@/components/MasterData/archives/business/customs-type/index.vue')
  },
  {
    key: 'exportReason',
    labelKey: 'page.dataManage.business.exportReason.title',
    load: () => import('@/components/MasterData/archives/business/export-reason/index.vue')
  },
  {
    key: 'clearanceMethod',
    labelKey: 'page.dataManage.business.clearanceMethod.title',
    load: () => import('@/components/MasterData/archives/business/clearance-method/index.vue')
  },
  {
    key: 'salesTerms',
    labelKey: 'page.dataManage.business.salesTerms.title',
    load: () => import('@/components/MasterData/archives/business/sales-terms/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
