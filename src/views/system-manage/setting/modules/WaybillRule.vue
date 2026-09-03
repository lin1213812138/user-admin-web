<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

interface WaybillRule {
  id: number;
  name: string;
  prefix: string;
  startValue: number;
  step: number;
  currentNo: number;
  status: Api.Common.EnableStatus;
  createTime: string;
}

const mockRules: WaybillRule[] = [
  {
    id: 1,
    name: '默认运单号规则',
    prefix: 'YD',
    startValue: 1000,
    step: 1,
    currentNo: 1025,
    status: 1,
    createTime: '2026-01-01 10:00'
  },
  {
    id: 2,
    name: '专线运单号规则',
    prefix: 'ZX',
    startValue: 5000,
    step: 1,
    currentNo: 5033,
    status: 1,
    createTime: '2026-02-15 14:30'
  },
  {
    id: 3,
    name: '测试运单号规则',
    prefix: 'CS',
    startValue: 1,
    step: 1,
    currentNo: 8,
    status: 0,
    createTime: '2026-03-20 09:12'
  }
];

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  { records: WaybillRule[]; total: number },
  WaybillRule
>({
  api: () => Promise.resolve({ records: mockRules, total: mockRules.length }),
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'name', title: '规则名称', type: 'detail', visible: true, sortable: false },
      { key: 'prefix', title: '前缀', visible: true, sortable: false },
      { key: 'startValue', title: '起始值', visible: true, sortable: false },
      { key: 'step', title: '步长', visible: true, sortable: false },
      { key: 'currentNo', title: '当前序号', visible: true, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      { key: 'createTime', title: '创建时间', visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-setting-waybill-rule'
});

const configVisible = ref(false);

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
function handleDelete(row: WaybillRule) {
  data.value = data.value.filter(item => item.id !== row.id);
  pagination.total = Math.max(0, pagination.total - 1);
}
</script>

<template>
  <div class="h-full w-full p-16px">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-action="true"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #operation-left>
        <NSpace justify="start" wrap>
          <NButton size="small" type="primary" ghost @click="getData">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </NSpace>
      </template>
      <template #operation-right>
        <NSpace justify="end" wrap>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
          <NButton size="small" @click="getData">
            <template #icon><icon-mdi-refresh class="text-icon" /></template>
          </NButton>
        </NSpace>
      </template>
      <template #action="{ row }">
        <NSpace justify="center">
          <NButton size="small" type="primary" text>{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Table>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />
  </div>
</template>
