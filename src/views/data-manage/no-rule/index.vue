<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 单号资料四项（懒加载子模块）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs([
  {
    key: 'no-rule',
    labelKey: 'page.dataManage.noRule.title',
    permission: 'system:dataNoRule:noRule',
    load: () => import('@/views/data-manage/no-rule/modules/no-rule/NoRule.vue')
  },
  {
    key: 'item-no-rule',
    labelKey: 'page.dataManage.noRule.itemNoRule.title',
    permission: 'system:dataNoRule:itemNoRule',
    load: () => import('@/views/data-manage/no-rule/modules/item-no-rule/ItemNoRule.vue')
  },
  {
    key: 'no-pool',
    labelKey: 'page.dataManage.noRule.noPool.title',
    permission: 'system:dataNoRule:noPool',
    load: () => import('@/views/data-manage/no-rule/modules/no-pool/NoPool.vue')
  },
  {
    key: 'long-no-rule',
    labelKey: 'page.dataManage.noRule.longNoRule.title',
    permission: 'system:dataNoRule:longNoRule',
    load: () => import('@/views/data-manage/no-rule/modules/long-no-rule/LongNoRule.vue')
  }
]);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_no-rule')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
