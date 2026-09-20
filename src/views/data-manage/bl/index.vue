<script setup lang="ts">
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import { useArchiveTabs } from '@/views/data-manage/components/useArchiveTabs';

/** 提单资料六项（懒加载子档案）：左侧竖向 tab 按角色权限过滤后生成 */
const { tabs, activeKey, activeComponent } = useArchiveTabs(
  [
    {
      key: 'blRoute',
      labelKey: 'page.dataManage.bl.blRoute.title',
      permission: 'system:dataBl:blRoute',
      load: () => import('@/views/data-manage/bl/modules/bl-route/index.vue')
    },
    {
      key: 'blPort',
      labelKey: 'page.dataManage.bl.blPort.title',
      permission: 'system:dataBl:blPort',
      load: () => import('@/views/data-manage/bl/modules/bl-port/index.vue')
    },
    {
      key: 'blTrip',
      labelKey: 'page.dataManage.bl.blTrip.title',
      permission: 'system:dataBl:blTrip',
      load: () => import('@/views/data-manage/bl/modules/bl-trip/index.vue')
    },
    {
      key: 'blAddress',
      labelKey: 'page.dataManage.bl.blAddress.title',
      permission: 'system:dataBl:blAddress',
      load: () => import('@/views/data-manage/bl/modules/bl-address/index.vue')
    },
    {
      key: 'blUnit',
      labelKey: 'page.dataManage.bl.blUnit.title',
      permission: 'system:dataBl:blUnit',
      load: () => import('@/views/data-manage/bl/modules/bl-unit/index.vue')
    },
    {
      key: 'trackConfig',
      labelKey: 'page.dataManage.bl.trackConfig.title',
      permission: 'system:dataBl:trackConfig',
      load: () => import('@/views/data-manage/bl/modules/track-config/index.vue')
    }
  ],
  { urlSync: true }
);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_bl')">
    <KeepAlive>
      <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
    </KeepAlive>
  </VerticalTabLayout>
</template>
