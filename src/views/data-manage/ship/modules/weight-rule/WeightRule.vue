<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteWeightRule, fetchGetWeightRuleList } from '@/service/api/data-manage-ship';
import WeightRuleSearchForm from './WeightRuleSearchForm.vue';
import WeightRuleOperateDrawer from './WeightRuleOperateDrawer.vue';

/** 名称搜索关键字 */
const keyword = ref('');

/** 计算方式（后端新增字段 calcMode：0-按公斤 1-按方） */
const calcModeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byKg'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byCubic'), value: 1 }
]);

/** 计泡类型（后端固定枚举 mode 0-3） */
const modeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.modeOption.m0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m3'), value: 3 }
]);

/** 计泡类型列展示文案 */
function modeLabel(mode?: number) {
  return modeOptions.value.find(item => item.value === mode)?.label ?? '';
}

/** 计算方式列展示文案 */
function calcModeLabel(calcMode?: number) {
  return calcModeOptions.value.find(item => item.value === calcMode)?.label ?? '';
}

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.WeightRule>,
  Api.DataManageShip.WeightRule
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetWeightRuleList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: {}
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.ship.weightRule.title'),
        type: 'detail',
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'calcMode',
        title: $t('page.dataManage.ship.weightRule.calcMode'),
        visible: true,
        width: 110,
        sortable: false
      },
      { key: 'mode', title: $t('page.dataManage.ship.weightRule.mode'), visible: true, minWidth: 200, sortable: false },
      {
        key: 'weightOff',
        title: $t('page.dataManage.ship.weightRule.weightOff'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'cubicNum',
        title: $t('page.dataManage.ship.weightRule.cubicNum'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.ship.weightRule.order'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-weight-rule'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.WeightRule[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.WeightRule[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.WeightRule) {
  const { error } = await fetchDeleteWeightRule(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteWeightRule(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof WeightRuleOperateDrawer> | null>(null);
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
        <WeightRuleSearchForm v-model:keyword="keyword" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #calcMode="{ row }">
        <span>{{ calcModeLabel(row.calcMode) }}</span>
      </template>
      <template #mode="{ row }">
        <span>{{ modeLabel(row.mode) }}</span>
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

    <WeightRuleOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
