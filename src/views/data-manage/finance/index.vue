<script setup lang="ts">
import ArchiveSwitch, { type ArchiveSwitchItem } from '@/components/MasterData/archive-switch.vue';

const items: ArchiveSwitchItem[] = [
  {
    key: 'expense-type',
    labelKey: 'page.dataManage.finance.expenseType.title',
    load: () => import('@/components/MasterData/archives/finance/expense-type/index.vue')
  },
  {
    key: 'settlement',
    labelKey: 'page.dataManage.finance.settlement.title',
    load: () => import('@/components/MasterData/archives/finance/settlement/index.vue')
  },
  {
    key: 'account',
    labelKey: 'page.dataManage.finance.account.title',
    load: () => import('@/components/MasterData/archives/finance/account/index.vue')
  },
  {
    key: 'currency',
    labelKey: 'page.dataManage.finance.currency.title',
    load: () => import('@/components/MasterData/archives/finance/currency/index.vue')
  }
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
