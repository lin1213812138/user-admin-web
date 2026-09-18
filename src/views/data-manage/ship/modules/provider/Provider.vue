<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteProvider, fetchGetProviderList } from '@/service/api/data-manage-ship';
import ProviderSearchForm from './ProviderSearchForm.vue';
import ProviderOperateDrawer from './ProviderOperateDrawer.vue';

/** 当前服务商类型（NRadioGroup 切换后重查） */
const providerType = ref<0 | 1 | 2 | 3>(0);
/** 名称搜索关键字（后端 keywordFields: ['name']） */
const keyword = ref('');
/** 状态筛选（null = 全部） */
const statusFilter = ref<0 | 1 | null>(null);

const statusOptions = computed(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const providerTypeOptions = computed(() => [
  { label: $t('page.dataManage.ship.provider.typeOption.out'), value: 0 },
  { label: $t('page.dataManage.ship.provider.typeOption.send'), value: 1 },
  { label: $t('page.dataManage.ship.provider.typeOption.bl'), value: 2 },
  { label: $t('page.dataManage.ship.provider.typeOption.other'), value: 3 }
]);

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Provider>,
  Api.DataManageShip.Provider
>({
  // 真实接口 flat request：解包 { data, error }，失败返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = { providerType: providerType.value };
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetProviderList({
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
        title: $t('page.dataManage.ship.provider.code'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.ship.provider.name'), visible: true, minWidth: 140, sortable: false },
      {
        key: 'billMode',
        title: $t('page.dataManage.ship.provider.billMode'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'contact',
        title: $t('page.dataManage.ship.provider.contact'),
        visible: true,
        width: 100,
        sortable: false
      },
      { key: 'phone', title: $t('page.dataManage.ship.provider.phone'), visible: true, width: 130, sortable: false },
      {
        key: 'balance',
        title: $t('page.dataManage.ship.provider.balance'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
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
  cacheKey: 'data-manage-ship-provider'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  statusFilter.value = null;
  providerType.value = 0;
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.Provider[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.Provider[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.Provider) {
  const { error } = await fetchDeleteProvider(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteProvider(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof ProviderOperateDrawer> | null>(null);
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
        <ProviderSearchForm
          v-model:provider-type="providerType"
          v-model:keyword="keyword"
          v-model:status-filter="statusFilter"
          :provider-type-options="providerTypeOptions"
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
        <NButton type="primary" ghost size="small" @click="drawerRef?.openCreate(providerType)">
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

    <ProviderOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
