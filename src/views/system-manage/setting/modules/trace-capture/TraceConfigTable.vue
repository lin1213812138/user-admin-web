<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton } from 'naive-ui';
import { fetchGetTraceConfigList } from '@/service/api/trace-config';
import TraceConfigDrawer from './TraceConfigDrawer.vue';

const props = defineProps<{ category: Api.SystemManage.TraceCaptureCategory }>();

const categoryTabKey: Record<
  Api.SystemManage.TraceCaptureCategory,
  'trackNetwork' | 'trackTransform' | 'trackKeyword' | 'captureTime'
> = {
  'track-network': 'trackNetwork',
  'track-transform': 'trackTransform',
  'track-keyword': 'trackKeyword',
  'capture-time': 'captureTime'
};

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceConfigList,
  Api.SystemManage.TraceConfigItem
>({
  api: ({ current, size }) =>
    fetchGetTraceConfigList({ category: props.category, current, size }) as Promise<Api.SystemManage.TraceConfigList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t(`page.manage.setting.traceCapture.subTab.${categoryTabKey[props.category]}`),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'serverAddress',
        title: $t('page.manage.setting.traceCapture.col.serverAddress'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'systemType',
        title: $t('page.manage.setting.traceCapture.col.systemType'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.traceCapture.col.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.traceCapture.col.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: `trace-config-${props.category}`
});

const configVisible = ref(false);
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceConfigItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.SystemManage.TraceConfigItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="120"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </template>
        <template #operation-right>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
        </template>
        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        </template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
    <TraceConfigDrawer
      v-model:show="drawerVisible"
      :mode="drawerMode"
      :category="props.category"
      :row="drawerRow"
      @submitted="getData"
    />
  </div>
</template>
