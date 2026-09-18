<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import {
  fetchDeleteFbaWarehouse,
  fetchGetFbaWarehouseList,
  type FbaWarehouseQueryResult
} from '@/service/api/data-manage-basic';
import FbaWarehouseSearchForm from './FbaWarehouseSearchForm.vue';
import FbaWarehouseOperateDrawer from './FbaWarehouseOperateDrawer.vue';

type BasicFbaWarehouse = Api.DataManage.BasicFbaWarehouse;

const keyword = ref('');

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  FbaWarehouseQueryResult,
  BasicFbaWarehouse
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetFbaWarehouseList({
      page: current,
      size,
      keyword: keyword.value || undefined
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.basic.fbaWarehouse.code'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'warehouse',
        title: $t('page.dataManage.basic.fbaWarehouse.warehouse'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.dataManage.basic.fbaWarehouse.name'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'phone',
        title: $t('page.dataManage.basic.fbaWarehouse.phone'),
        visible: true,
        minWidth: 130,
        sortable: false
      },
      {
        key: 'country',
        title: $t('page.dataManage.basic.fbaWarehouse.country'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'city',
        title: $t('page.dataManage.basic.fbaWarehouse.city'),
        visible: true,
        minWidth: 100,
        sortable: false
      },
      {
        key: 'state',
        title: $t('page.dataManage.basic.fbaWarehouse.state'),
        visible: true,
        minWidth: 100,
        sortable: false
      },
      {
        key: 'zip',
        title: $t('page.dataManage.basic.fbaWarehouse.zip'),
        visible: true,
        minWidth: 100,
        sortable: false
      },
      {
        key: 'address',
        title: $t('page.dataManage.basic.fbaWarehouse.address'),
        visible: true,
        minWidth: 220,
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 180,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-basic-fba-warehouse'
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

const checkedRows = ref<BasicFbaWarehouse[]>([]);
function handleSelectionChange(rows: BasicFbaWarehouse[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: BasicFbaWarehouse) {
  const { error } = await fetchDeleteFbaWarehouse([row._id]);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  const { error } = await fetchDeleteFbaWarehouse(checkedRows.value.map(i => i._id));
  if (error) return;
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof FbaWarehouseOperateDrawer> | null>(null);
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
        <FbaWarehouseSearchForm v-model:keyword="keyword" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime((row as BasicFbaWarehouse).createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="drawerRef?.openCreate()">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="confirmBatchDelete">
          <template #trigger>
            <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
              {{ $t('common.batchDelete') }}
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
        <NButton size="small" type="primary" text @click="drawerRef?.openEdit(row as BasicFbaWarehouse)">
          {{ $t('common.edit') }}
        </NButton>
        <NPopconfirm @positive-click="confirmDelete(row as BasicFbaWarehouse)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <FbaWarehouseOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
