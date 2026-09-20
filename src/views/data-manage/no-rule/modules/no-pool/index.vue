<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { TableExportAction } from '@/components/Export';
import type { ExportField } from '@/components/Export';
import { fetchDeleteNoPool, fetchGetNoPoolList } from '@/service/api/data-manage-no-rule';
import NoPoolSearchForm from './NoPoolSearchForm.vue';
import NoPoolOperateDrawer from './NoPoolOperateDrawer.vue';
import { useNoPoolRefTypeOptions } from '@/composables/use-options';

const refTypeOptions = useNoPoolRefTypeOptions();

const no = ref('');
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}
function optLabel(options: SelectOption[], v?: number) {
  const hit = options.find(o => o.value === v);
  return hit ? String(hit.label) : '--';
}

/** 导出取值：渠道类型文案（查不到输出空串，不把表格的 '--' 带进表格文件） */
function exportRefTypeText(value: unknown): string {
  const hit = refTypeOptions.value.find(opt => opt.value === value);
  return hit ? String(hit.label) : '';
}
/** 导出取值：状态文案（0-未提取 1-已提取，区别于内置 status 的启用/禁用格式） */
function exportStatusText(value: unknown): string {
  return value === 1 ? $t('page.dataManage.noRule.noPool.picked') : $t('page.dataManage.noRule.noPool.unpicked');
}
/** 导出取值：时间格式化（空值输出空串） */
function exportDateTime(value: unknown): string {
  return typeof value === 'number' && value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '';
}

/** 导出字段：表格中用插槽渲染的列需按展示文案取值（组件按 key 覆盖同名列） */
const exportFields = computed<ExportField[]>(() => [
  { key: 'refType', title: $t('page.dataManage.noRule.noPool.refType'), formatter: exportRefTypeText },
  { key: 'status', title: $t('common.status'), formatter: exportStatusText },
  { key: 'pickDate', title: $t('page.dataManage.noRule.noPool.pickDate'), formatter: exportDateTime },
  { key: 'createDate', title: $t('page.dataManage.noRule.noPool.createDate'), formatter: exportDateTime }
]);

/** 当前搜索条件（列表与导出共用，保证「导出 = 所见」） */
function buildWhere(): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  // no-pool 后端 query 未定义 keywordFields，keyword 会被 queryCommon 忽略，故用 where.no 模糊匹配
  if (no.value) where.no = { $regex: no.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  return where;
}

/**
 * 导出「全部数据」：按当前条件分页取尽。
 * 后端 queryCommon 单次查询上限 SAFE_MAX_LIMIT=5000（tms-user lib/common/utils/index.js），一次大 size 会被静默截断。
 */
async function fetchAllNoPools(): Promise<Api.NoPool.Item[]> {
  const pageSize = 1000;
  const rows: Api.NoPool.Item[] = [];
  let current = 1;
  let total = Number.POSITIVE_INFINITY;
  while (rows.length < total) {
    const { data: res, error } = await fetchGetNoPoolList({ page: current, size: pageSize, where: buildWhere() });
    if (error || !res) break;
    rows.push(...res.list);
    total = res.total;
    if (res.list.length === 0) break;
    current += 1;
  }
  return rows;
}

const { data, loading, columnConfigs, columns, pagination, getData } = useVxeTable<Api.NoPool.List, Api.NoPool.Item>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetNoPoolList({ page: current, size, where: buildWhere() });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'no',
        title: $t('page.dataManage.noRule.noPool.noTitle'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'refName',
        title: $t('page.dataManage.noRule.noPool.channelName'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'refType',
        title: $t('page.dataManage.noRule.noPool.refType'),
        visible: true,
        width: 120,
        sortable: false
      },
      { key: 'status', title: $t('common.status'), visible: true, width: 100, align: 'center', sortable: false },
      { key: 'pickBy', title: $t('page.dataManage.noRule.noPool.pickBy'), visible: true, width: 110, sortable: false },
      {
        key: 'pickDate',
        title: $t('page.dataManage.noRule.noPool.pickDate'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      },
      {
        key: 'creator',
        title: $t('page.dataManage.noRule.noPool.creator'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.noRule.noPool.createDate'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-no-rule-pool'
});

function handleSearch() {
  pagination.current = 1;
  getData();
}
function handleReset() {
  no.value = '';
  pagination.current = 1;
  getData();
}
function handlePageChange({ current, size }: Api.Common.CommonSearchParams) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

const checkedRows = ref<Api.NoPool.Item[]>([]);
function handleSelectionChange(rows: Api.NoPool.Item[]) {
  checkedRows.value = rows;
}
async function confirmBatchDelete() {
  const { error } = await fetchDeleteNoPool(checkedRows.value.map(row => row._id));
  if (error) return;
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof NoPoolOperateDrawer> | null>(null);
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
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <NoPoolSearchForm v-model:no="no" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #refType="{ row }">
        <span>{{ optLabel(refTypeOptions, row.refType) }}</span>
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'default'" size="small">
          {{
            row.status === 1 ? $t('page.dataManage.noRule.noPool.picked') : $t('page.dataManage.noRule.noPool.unpicked')
          }}
        </NTag>
      </template>
      <template #pickDate="{ row }">
        <span>{{ formatDateTime(row.pickDate) }}</span>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #operation-left>
        <LButton type="primary" @click="drawerRef?.openImport()">
          <template #icon><icon-ic-round-file-upload class="text-icon" /></template>
          {{ $t('page.dataManage.noRule.noPool.import') }}
        </LButton>
        <LButton type="error" popconfirm :disabled="checkedRows.length === 0" @positive-click="confirmBatchDelete">
          <template #icon><icon-ic-round-delete class="text-icon" /></template>
          {{ $t('common.batchDelete') }}
        </LButton>
        <TableExportAction
          :columns="columnConfigs"
          :data="data"
          :checked-data="checkedRows"
          :fetch-all="fetchAllNoPools"
          :extra-fields="exportFields"
          :filename="$t('page.dataManage.noRule.noPool.title')"
        />
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
      </template>
    </Table>

    <NoPoolOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
