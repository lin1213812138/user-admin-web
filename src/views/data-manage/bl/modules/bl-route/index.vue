<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteBlRoute, fetchGetBlRouteList } from '@/service/api/data-manage-bl';
import BlRouteSearchForm from './BlRouteSearchForm.vue';
import BlRouteOperateDrawer from './BlRouteOperateDrawer.vue';

const keyword = ref('');
const statusFilter = ref<0 | 1 | null>(null);

const statusOptions = computed(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlRoute>,
  Api.DataManageBl.BlRoute
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = {};
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetBlRouteList({
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
      {
        key: 'code',
        title: $t('page.dataManage.bl.blRoute.code'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'routeType',
        title: $t('page.dataManage.bl.blRoute.routeType'),
        visible: true,
        minWidth: 110,
        sortable: false
      },
      { key: 'nameCn', title: $t('page.dataManage.bl.blRoute.nameCn'), visible: true, minWidth: 140, sortable: false },
      { key: 'nameEn', title: $t('page.dataManage.bl.blRoute.nameEn'), visible: true, minWidth: 140, sortable: false },
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
  cacheKey: 'data-manage-bl-route'
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

const checkedRows = ref<Api.DataManageBl.BlRoute[]>([]);
function handleSelectionChange(rows: Api.DataManageBl.BlRoute[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: Api.DataManageBl.BlRoute) {
  const { error } = await fetchDeleteBlRoute(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteBlRoute(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof BlRouteOperateDrawer> | null>(null);
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
        <BlRouteSearchForm
          v-model:keyword="keyword"
          v-model:status-filter="statusFilter"
          :status-options="statusOptions"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>
      <template #routeType="{ row }">
        <NTag :type="row.routeType === 1 ? 'success' : 'warning'" size="small">
          {{
            row.routeType === 1
              ? $t('page.dataManage.bl.blRoute.routeTypeOption.sea')
              : $t('page.dataManage.bl.blRoute.routeTypeOption.air')
          }}
        </NTag>
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
        <LButton type="primary" ghost @click="drawerRef?.openCreate()">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </LButton>
        <LButton
          type="error"
          ghost
          :disabled="checkedRows.length === 0"
          popconfirm
          @positive-click="confirmBatchDelete"
        >
          {{ $t('common.delete') }}
        </LButton>
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle :tooltip="$t('common.refresh')" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <LButton type="primary" text @click="drawerRef?.openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton type="error" text popconfirm @positive-click="confirmDelete(row)">{{ $t('common.delete') }}</LButton>
      </template>
    </Table>

    <BlRouteOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
