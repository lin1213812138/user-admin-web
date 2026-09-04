<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { $t } from '@/locales';
import InputFormat from './modules/InputFormat.vue';
import PrintFormat from './modules/PrintFormat.vue';
import ExportFormat from './modules/ExportFormat.vue';
import WaybillRule from './modules/WaybillRule.vue';
import NotificationConfig from './modules/NotificationConfig.vue';
import InitData from './modules/InitData.vue';
import StationScan from './modules/StationScan.vue';

const tabs = [
  { key: 'input-format', label: $t('page.manage.setting.inputFormat') },
  { key: 'print-format', label: $t('page.manage.setting.printFormat.title') },
  { key: 'export-format', label: $t('page.manage.setting.exportFormat') },
  { key: 'waybill-rule', label: $t('page.manage.setting.waybillRule') },
  { key: 'notification-config', label: $t('page.manage.setting.notificationConfig') },
  { key: 'init-data', label: $t('page.manage.setting.initData') },
  { key: 'station-scan', label: $t('page.manage.setting.stationScan') }
];

const activeKey = ref('input-format');

const componentMap: Record<string, Component> = {
  'input-format': InputFormat,
  'print-format': PrintFormat,
  'export-format': ExportFormat,
  'waybill-rule': WaybillRule,
  'notification-config': NotificationConfig,
  'init-data': InitData,
  'station-scan': StationScan
};

const activeComponent = computed<Component>(() => componentMap[activeKey.value] ?? InputFormat);

function handleTabChange(key: string) {
  activeKey.value = key;
}
</script>

<template>
  <div class="h-full w-full flex-col p-16px">
    <NCard class="mb-16px" :content-style="{ padding: '8px' }">
      <NTabs :value="activeKey" type="segment" @update:value="handleTabChange">
        <NTabPane v-for="t in tabs" :key="t.key" class="!p-0" :name="t.key" :tab="t.label" />
      </NTabs>
    </NCard>
    <div class="min-h-0 flex-1">
      <KeepAlive>
        <component :is="activeComponent" />
      </KeepAlive>
    </div>
  </div>
</template>
