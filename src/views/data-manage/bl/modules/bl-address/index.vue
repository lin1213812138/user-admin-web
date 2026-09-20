<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteBlAddress, fetchGetBlAddressList } from '@/service/api/data-manage-bl';
import BlAddressSearchForm from './BlAddressSearchForm.vue';
import BlAddressOperateDrawer from './BlAddressOperateDrawer.vue';

/** 9 类地址簿（label 固定文案，对齐 i18n typeOption） */
const addressTypeOptions = computed(() => {
  const typeOption: Record<string, string> = {
    BY: '买方公司',
    ST: '送达方',
    CN: '收货人',
    SE: '卖方公司',
    MF: '生产商',
    IM: '进口商',
    BKP: '订舱人',
    CS: '拼箱人',
    LG: '装柜地址'
  };
  return Object.entries(typeOption).map(([value, label]) => ({ label, value }));
});

/** 当前地址类型（切换后重查） */
const activeType = ref('BY');
const keyword = ref('');

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlAddress>,
  Api.DataManageBl.BlAddress
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = { addressType: activeType.value };
    const { data: res, error } = await fetchGetBlAddressList({
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
      { key: 'name', title: '姓名', type: 'detail', visible: true, minWidth: 120, sortable: false },
      { key: 'company', title: '公司', visible: true, minWidth: 160, sortable: false },
      { key: 'phone', title: '电话', visible: true, minWidth: 140, sortable: false },
      { key: 'city', title: '城市', visible: true, width: 120, sortable: false },
      { key: 'state', title: '省州', visible: true, width: 120, sortable: false },
      { key: 'zip', title: '邮编', visible: true, width: 100, sortable: false },
      { key: 'address', title: '地址', visible: true, minWidth: 220, sortable: false },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-bl-address'
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

watch(activeType, () => {
  pagination.current = 1;
  getData();
});

const checkedRows = ref<Api.DataManageBl.BlAddress[]>([]);
function handleSelectionChange(rows: Api.DataManageBl.BlAddress[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: Api.DataManageBl.BlAddress) {
  const { error } = await fetchDeleteBlAddress(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteBlAddress(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof BlAddressOperateDrawer> | null>(null);
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
        <BlAddressSearchForm
          v-model:active-type="activeType"
          v-model:keyword="keyword"
          :address-type-options="addressTypeOptions"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="drawerRef?.openCreate(activeType)">
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

    <BlAddressOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
