<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 本组资料项（懒加载子档案）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs(
  [
    {
      key: 'expenseType',
      labelKey: 'page.dataManage.finance.expenseType.title',
      permission: 'system:dataFinance:expenseType',
      load: () => import('@/views/data-manage/finance/modules/expense-type/index.vue')
    },
    {
      key: 'settlement',
      labelKey: 'page.dataManage.finance.settlement.title',
      permission: 'system:dataFinance:settlement',
      load: () => import('@/views/data-manage/finance/modules/settlement/index.vue')
    },
    {
      key: 'account',
      labelKey: 'page.dataManage.finance.account.title',
      permission: 'system:dataFinance:account',
      load: () => import('@/views/data-manage/finance/modules/account/index.vue')
    },
    {
      key: 'currency',
      labelKey: 'page.dataManage.finance.currency.title',
      permission: 'system:dataFinance:currency',
      load: () => import('@/views/data-manage/finance/modules/currency/index.vue')
    }
  ],
  { urlSync: true }
);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_finance')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
