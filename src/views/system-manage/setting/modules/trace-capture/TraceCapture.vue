<script setup lang="ts">
import { ref } from 'vue';
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
</script>

<template>
  <NCard class="h-full" :content-style="{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }">
    <div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-16px py-16px">
      <NTabs :value="active" type="line" class="trace-capture-tabs" @update:value="handleTabChange">
        <NTabPane v-for="t in configTabs" :key="t.key" :name="t.key" :tab="t.label">
          <TraceTransformTable v-if="t.key === 'track-transform'" />
          <TraceKeywordTable v-else-if="t.key === 'track-keyword'" />
          <CaptureTimeTable v-else-if="t.key === 'capture-time'" />
          <TrackNetworkTable v-else :category="t.key" />
        </NTabPane>
      </NTabs>
    </div>
  </NCard>
</template>

<style scoped>
.trace-capture-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.trace-capture-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

.trace-capture-tabs :deep(.n-tab-pane) {
  height: 100%;
}
</style>
