<script setup lang="ts">
import { computed, onActivated, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';
import { $t } from '@/locales';
import InputFormat from './modules/input-format/InputFormat.vue';
import PrintFormat from './modules/print-format/PrintFormat.vue';
import ExportFormat from './modules/export-format/ExportFormat.vue';
import WaybillRule from './modules/waybill-rule/WaybillRule.vue';
import TraceCapture from './modules/trace-capture/TraceCapture.vue';
import InitData from './modules/init-data/InitData.vue';

const route = useRoute();

const tabs = [
  { key: 'input-format', label: $t('page.manage.setting.inputFormat') },
  { key: 'print-format', label: $t('page.manage.setting.printFormat.title') },
  { key: 'export-format', label: $t('page.manage.setting.exportFormat.title') },
  { key: 'waybill-rule', label: $t('page.manage.setting.waybillRule') },
  { key: 'trace-capture', label: $t('page.manage.setting.traceCapture.title') },
  { key: 'init-data', label: $t('page.manage.setting.initData.title') }
];

const activeKey = ref('input-format');

/** 从 URL query（如 ?tab=print-format，来自标签设计页「返回上一页」）切换到对应分页 */
function syncTabFromQuery() {
  const tab = route.query.tab;
  if (typeof tab === 'string' && tabs.some(t => t.key === tab)) {
    activeKey.value = tab;
  }
}

syncTabFromQuery();
onActivated(syncTabFromQuery);

const componentMap: Record<string, Component> = {
  'input-format': InputFormat,
  'print-format': PrintFormat,
  'export-format': ExportFormat,
  'waybill-rule': WaybillRule,
  'trace-capture': TraceCapture,
  'init-data': InitData
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
