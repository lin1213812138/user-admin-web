<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteTrackConfig, fetchGetTrackConfigList } from '@/service/api/data-manage-bl';
import TrackConfigSearchForm from './TrackConfigSearchForm.vue';
import TrackConfigOperateDrawer from './TrackConfigOperateDrawer.vue';

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
  Api.DataManageBl.BlQueryResult<Api.DataManageBl.TrackConfig>,
  Api.DataManageBl.TrackConfig
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = {};
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetTrackConfigList({
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
        key: 'name',
        title: $t('page.dataManage.bl.trackConfig.name'),
        type: 'detail',
        visible: true,
        minWidth: 160,
        sortable: false
      },
      { key: 'trackType', title: '轨迹类型', visible: true, width: 140, sortable: false },
      { key: 'url', title: $t('page.dataManage.bl.trackConfig.url'), visible: true, minWidth: 220, sortable: false },
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
  cacheKey: 'data-manage-bl-track-config'
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

const checkedRows = ref<Api.DataManageBl.TrackConfig[]>([]);
function handleSelectionChange(rows: Api.DataManageBl.TrackConfig[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: Api.DataManageBl.TrackConfig) {
  const { error } = await fetchDeleteTrackConfig(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteTrackConfig(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof TrackConfigOperateDrawer> | null>(null);
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
        <TrackConfigSearchForm
          v-model:keyword="keyword"
          v-model:status-filter="statusFilter"
          :status-options="statusOptions"
          @search="handleSearch"
          @reset="handleReset"
        />
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

    <TrackConfigOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
