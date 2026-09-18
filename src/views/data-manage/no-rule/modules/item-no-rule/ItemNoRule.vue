<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import {
  fetchDeleteItemNoRule,
  fetchGetItemNoRuleList,
  type ItemNoRule as ItemNoRuleItem
} from '@/service/api/data-manage-no-rule';
import ItemNoRuleSearchForm from './ItemNoRuleSearchForm.vue';
import ItemNoRuleOperateDrawer from './ItemNoRuleOperateDrawer.vue';

const prefixTypeOptions = [
  { label: '内单号', value: 0 },
  { label: '转单号', value: 1 },
  { label: '客户单号', value: 2 },
  { label: '派送单号', value: 3 }
];
const suffixTypeOptions = [{ label: '箱序号', value: 0 }];
const suffixPadOptions = [
  { label: '原始长度', value: 0 },
  { label: '按总件数位数', value: 1 },
  { label: '3位', value: 2 },
  { label: '4位', value: 3 }
];

const keyword = ref('');
const statusFilter = ref<0 | 1 | null>(null);
const statusOptions = computed(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}
function optLabel(options: { label: string; value: number }[], v?: number) {
  return options.find(o => o.value === v)?.label ?? '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  { list: ItemNoRuleItem[]; total: number },
  ItemNoRuleItem
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = {};
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetItemNoRuleList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      { key: 'name', title: '规则名称', type: 'detail', visible: true, minWidth: 160, sortable: false },
      { key: 'prefixType', title: '单号首段', visible: true, width: 120, sortable: false },
      { key: 'middleType', title: '单号中段', visible: true, width: 120, sortable: false },
      { key: 'suffixType', title: '单号尾段', visible: true, width: 120, sortable: false },
      { key: 'suffixPadType', title: '尾段补全', visible: true, width: 120, sortable: false },
      { key: 'status', title: $t('common.status'), visible: true, width: 90, align: 'center', sortable: false },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-no-rule-item'
});

const columnConfigVisible = ref(false);
function handleSearch() {
  pagination.current = 1;
  getData();
}
function handleReset() {
  keyword.value = '';
  statusFilter.value = null;
  pagination.current = 1;
  getData();
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

const checkedRows = ref<ItemNoRuleItem[]>([]);
function handleSelectionChange(rows: ItemNoRuleItem[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: ItemNoRuleItem) {
  const { error } = await fetchDeleteItemNoRule(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteItemNoRule(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof ItemNoRuleOperateDrawer> | null>(null);
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      show-checkbox
      show-action
      :action-width="140"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <ItemNoRuleSearchForm
          v-model:keyword="keyword"
          v-model:status-filter="statusFilter"
          :status-options="statusOptions"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>
      <template #prefixType="{ row }">
        <span>{{ optLabel(prefixTypeOptions, row.prefixType) }}</span>
      </template>
      <template #suffixType="{ row }">
        <span>{{ optLabel(suffixTypeOptions, row.suffixType) }}</span>
      </template>
      <template #suffixPadType="{ row }">
        <span>{{ optLabel(suffixPadOptions, row.suffixPadType) }}</span>
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'error'" size="small">
          {{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}
        </NTag>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="drawerRef?.openCreate()">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="confirmBatchDelete">
          <template #trigger>
            <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
              {{ $t('common.delete') }}
            </NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="drawerRef?.openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <ItemNoRuleOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
