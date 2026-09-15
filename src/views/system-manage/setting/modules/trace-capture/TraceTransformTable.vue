<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteTraceTransform, fetchGetTraceTransformList } from '@/service/api/system-manage';
import TraceTransformDrawer from './TraceTransformDrawer.vue';

/** 时间格式枚举 → 展示文案（走 i18n，不落库中文串） */
const timeFormatLabels: Record<Api.SystemManage.TraceTransformTimeFormat, string> = {
  ymd: $t('page.manage.setting.traceCapture.timeFormatOption.ymd'),
  'ymd-hm': $t('page.manage.setting.traceCapture.timeFormatOption.ymdHm'),
  'ymd-hms': $t('page.manage.setting.traceCapture.timeFormatOption.ymdHms')
};

/** 表格单元格展示时间格式文案（row 来自 vxe-table，入参按 string 收窄；非法值兜底占位符） */
function timeFormatLabel(value: string) {
  return timeFormatLabels[value as Api.SystemManage.TraceTransformTimeFormat] || '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceTransformList,
  Api.SystemManage.TraceTransformItem
>({
  api: ({ current, size }) =>
    fetchGetTraceTransformList({ current, size }) as Promise<Api.SystemManage.TraceTransformList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'statusName',
        title: $t('page.manage.setting.traceCapture.col.statusName'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'timeFormat',
        title: $t('page.manage.setting.traceCapture.col.timeFormat'),
        visible: true,
        width: 180,
        sortable: false
      },
      {
        key: 'location',
        title: $t('page.manage.setting.traceCapture.col.location'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'description',
        title: $t('page.manage.setting.traceCapture.col.description'),
        visible: true,
        minWidth: 220,
        sortable: false
      },
      {
        key: 'keywordDefinition',
        title: $t('page.manage.setting.traceCapture.col.keywordDefinition'),
        visible: true,
        minWidth: 220,
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'trace-transform'
});

const configVisible = ref(false);

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceTransformItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}

function openEdit(row: Api.SystemManage.TraceTransformItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteTraceTransform(ids);
  window.$message?.success($t('common.deleteSuccess'));
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
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            {{ $t('page.manage.setting.traceCapture.addRow') }}
          </NButton>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </NButton>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>

        <template #timeFormat="{ row }">{{ timeFormatLabel(row.timeFormat) }}</template>
        <template #location="{ row }">{{ row.location || '--' }}</template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <TraceTransformDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
  </div>
</template>
