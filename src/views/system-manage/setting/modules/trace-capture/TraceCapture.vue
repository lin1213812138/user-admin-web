<script setup lang="ts">
import { ref } from 'vue';
import type { Component } from 'vue';
import { $t } from '@/locales';
import { NCard, NTabPane, NTabs } from 'naive-ui';
import TrackNetworkTable from './track-network/TrackNetworkTable.vue';
import TraceTransformTable from './track-transform/TraceTransformTable.vue';
import TraceKeywordTable from './track-keyword/TraceKeywordTable.vue';
import CaptureTimeTable from './capture-time/CaptureTimeTable.vue';

type SubTabKey = Api.SystemManage.TraceCaptureCategory;

/** 4 个子页共用同一个 tab 数组；「轨迹改造」「轨迹关键词」「抓取时间」各自独立，追踪网络用 TrackNetworkTable（操作轨迹已拆为独立模块 operation-trace） */
const configTabs: { key: Api.SystemManage.TraceCaptureCategory; label: string }[] = [
  { key: 'track-network', label: $t('page.manage.setting.traceCapture.subTab.trackNetwork') },
  { key: 'track-transform', label: $t('page.manage.setting.traceCapture.subTab.trackTransform') },
  { key: 'track-keyword', label: $t('page.manage.setting.traceCapture.subTab.trackKeyword') },
  { key: 'capture-time', label: $t('page.manage.setting.traceCapture.subTab.captureTime') }
];

const active = ref<SubTabKey>('track-network');

/** naive NTabs 的 update:value 参数为 string | number，这里收敛回分类联合类型（模板内不做断言，规避 eslint vue/no-undef-properties 对模板里 Api.* 的误报） */
function handleTabChange(value: string | number) {
  active.value = value as SubTabKey;
}

/** 按需挂载：子 tab key → 对应表格组件，仅渲染当前激活的表格，切回时复用 keep-alive 缓存（不重新取数） */
const tableMap: Record<SubTabKey, Component> = {
  'track-network': TrackNetworkTable,
  'track-transform': TraceTransformTable,
  'track-keyword': TraceKeywordTable,
  'capture-time': CaptureTimeTable
};
</script>

<template>
  <NCard class="h-full" :content-style="{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }">
    <div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-16px py-16px">
      <NTabs :value="active" type="line" class="mb-5px" @update:value="handleTabChange">
        <NTabPane v-for="t in configTabs" :key="t.key" :name="t.key" :tab="t.label" />
      </NTabs>
      <KeepAlive>
        <component
          :is="tableMap[active]"
          :key="active"
          v-bind="active === 'track-network' ? { category: active } : {}"
          class="min-h-0 flex-1"
        />
      </KeepAlive>
    </div>
  </NCard>
</template>
