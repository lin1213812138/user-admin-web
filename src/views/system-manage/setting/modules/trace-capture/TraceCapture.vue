<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { NCard, NTabPane, NTabs } from 'naive-ui';
import TraceConfigTable from './TraceConfigTable.vue';
import TraceTransformTable from './TraceTransformTable.vue';
import TraceKeywordTable from './TraceKeywordTable.vue';
import OperationTraceTable from './OperationTraceTable.vue';

type SubTabKey = Api.SystemManage.TraceCaptureCategory | 'operation-trace';

/** 3 个子页共用同一个 tab 数组；「轨迹改造」「轨迹关键词」已各自独立，追踪网络仍用 TraceConfigTable */
const configTabs: { key: Api.SystemManage.TraceCaptureCategory; label: string }[] = [
  { key: 'track-network', label: $t('page.manage.setting.traceCapture.subTab.trackNetwork') },
  { key: 'track-transform', label: $t('page.manage.setting.traceCapture.subTab.trackTransform') },
  { key: 'track-keyword', label: $t('page.manage.setting.traceCapture.subTab.trackKeyword') }
  // 抓取时间模块暂缓（字段待定）：先注释隐藏，恢复时把下一行取消注释即可
  // { key: 'capture-time', label: $t('page.manage.setting.traceCapture.subTab.captureTime') }
];

const operationTabLabel = $t('page.manage.setting.traceCapture.subTab.operationTrace');

const active = ref<SubTabKey>('track-network');
</script>

<template>
  <NCard class="h-full" :content-style="{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '0' }">
    <div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-16px py-16px">
      <NTabs :value="active" type="line" class="trace-capture-tabs" @update:value="active = $event as SubTabKey">
        <NTabPane v-for="t in configTabs" :key="t.key" :name="t.key" :tab="t.label">
          <TraceTransformTable v-if="t.key === 'track-transform'" />
          <TraceKeywordTable v-else-if="t.key === 'track-keyword'" />
          <TraceConfigTable v-else :category="t.key" />
        </NTabPane>
        <NTabPane name="operation-trace" :tab="operationTabLabel">
          <OperationTraceTable />
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
