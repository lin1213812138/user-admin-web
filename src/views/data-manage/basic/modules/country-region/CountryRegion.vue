<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteCountry, fetchGetCountryList, type CountryQueryResult } from '@/service/api/data-manage-basic';
import CountryRegionSearchForm from './CountryRegionSearchForm.vue';
import CountryRegionOperateDrawer from './CountryRegionOperateDrawer.vue';
type BasicCountryRegion = Api.DataManage.BasicCountryRegion;

const keyword = ref('');

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  CountryQueryResult,
  BasicCountryRegion
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCountryList({
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
        title: $t('page.dataManage.basic.countryRegion.code'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'nameCn',
        title: $t('page.dataManage.basic.countryRegion.nameCn'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'nameEn',
        title: $t('page.dataManage.basic.countryRegion.nameEn'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.dataManage.basic.countryRegion.name'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'code2',
        title: $t('page.dataManage.basic.countryRegion.code2'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'code3',
        title: $t('page.dataManage.basic.countryRegion.code3'),
        visible: true,
        width: 100,
        align: 'center',
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
  cacheKey: 'data-manage-basic-country-region'
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

const checkedRows = ref<BasicCountryRegion[]>([]);
function handleSelectionChange(rows: BasicCountryRegion[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: BasicCountryRegion) {
  const { error } = await fetchDeleteCountry([row._id]);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  const { error } = await fetchDeleteCountry(checkedRows.value.map(i => i._id));
  if (error) return;
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof CountryRegionOperateDrawer> | null>(null);
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
        <CountryRegionSearchForm v-model:keyword="keyword" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime((row as BasicCountryRegion).createDate) }}</span>
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
        <NButton size="small" type="primary" text @click="drawerRef?.openEdit(row as BasicCountryRegion)">
          {{ $t('common.edit') }}
        </NButton>
        <NPopconfirm @positive-click="confirmDelete(row as BasicCountryRegion)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <CountryRegionOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
