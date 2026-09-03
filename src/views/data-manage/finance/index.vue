<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'account',
    labelKey: 'page.dataManage.finance.account.title',
    load: () => import('@/components/MasterData/archives/finance/account/index.vue')
  },
  {
    key: 'currency',
    labelKey: 'page.dataManage.finance.currency.title',
    load: () => import('@/components/MasterData/archives/finance/currency/index.vue')
  },
  {
    key: 'tax',
    labelKey: 'page.dataManage.finance.tax.title',
    load: () => import('@/components/MasterData/archives/finance/tax/index.vue')
  },
  {
    key: 'settlement',
    labelKey: 'page.dataManage.finance.settlement.title',
    load: () => import('@/components/MasterData/archives/finance/settlement/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
