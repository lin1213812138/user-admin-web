<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton, NTag } from 'naive-ui';
import { fetchGetOperationTraceList } from '@/service/api/system-manage';
import OperationTraceDrawer from './OperationTraceDrawer.vue';

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.OperationTraceList,
  Api.SystemManage.OperationTraceItem
>({
  api: ({ current, size }) =>
    fetchGetOperationTraceList({ current, size }) as Promise<Api.SystemManage.OperationTraceList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'node',
        title: $t('page.manage.setting.traceCapture.col.node'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'timeFormat',
        title: $t('page.manage.setting.traceCapture.col.timeFormat'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'location',
        title: $t('page.manage.setting.traceCapture.col.location'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'description',
        title: $t('page.manage.setting.traceCapture.col.description'),
        visible: true,
        minWidth: 200,
        sortable: false
      },
      {
        key: 'published',
        title: $t('page.manage.setting.traceCapture.col.published'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'operation-trace'
});

const configVisible = ref(false);
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.OperationTraceItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.SystemManage.OperationTraceItem) {
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
        <template #published="{ row }">
          <NTag v-if="row.published === 1" size="small" type="success">{{ $t('common.yesOrNo.yes') }}</NTag>
          <NTag v-else size="small" type="default">{{ $t('common.yesOrNo.no') }}</NTag>
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
    <OperationTraceDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
  </div>
</template>
