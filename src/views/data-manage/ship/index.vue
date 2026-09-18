<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 发货资料四项（懒加载子页）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs([
  {
    key: 'provider',
    labelKey: 'page.dataManage.ship.provider.title',
    permission: 'system:dataShip:provider',
    load: () => import('@/views/data-manage/ship/modules/provider/Provider.vue')
  },
  {
    key: 'channelGroup',
    labelKey: 'page.dataManage.ship.channelGroup.title',
    permission: 'system:dataShip:channelGroup',
    load: () => import('@/views/data-manage/ship/modules/channel-group/ChannelGroup.vue')
  },
  {
    key: 'weightRule',
    labelKey: 'page.dataManage.ship.weightRule.title',
    permission: 'system:dataShip:weightRule',
    load: () => import('@/views/data-manage/ship/modules/weight-rule/WeightRule.vue')
  },
  {
    key: 'carrier',
    labelKey: 'page.dataManage.ship.carrier.title',
    permission: 'system:dataShip:carrier',
    load: () => import('@/views/data-manage/ship/modules/carrier/Carrier.vue')
  }
]);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_ship')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
