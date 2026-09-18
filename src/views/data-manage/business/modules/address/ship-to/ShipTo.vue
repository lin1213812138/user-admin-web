<script setup lang="ts">
import { reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteShipTo, fetchGetShipToList } from '@/service/api/ship-address';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import ShipToOperateDrawer from './ShipToOperateDrawer.vue';

defineOptions({ name: 'ShipTo' });

const searchParams = reactive<{ keyword: string }>({ keyword: '' });

const { data, loading, columns, pagination, getData, resetColumns, persistColumns, columnConfigs } = useVxeTable<
  Api.SystemManage.CustomerAddressList,
  Api.SystemManage.CustomerAddress
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetShipToList({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined,
      // keyword 必须显式传 keywordFields 才生效（同 ship-to 老坑）
      keywordFields: ['name', 'phone', 'zip'],
      // 独立地址簿是跨客户的全局视图，不按 customerId 过滤
      where: {}
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'customer',
        title: $t('page.manage.customer.detail.customer'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'country',
        title: $t('page.manage.customer.detail.stCountry'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.manage.customer.detail.stName'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'company',
        title: $t('page.manage.customer.detail.stCompany'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'phone',
        title: $t('page.manage.customer.detail.stPhone'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'email',
        title: $t('page.manage.customer.detail.stEmail'),
        visible: true,
        width: 140,
        sortable: false
      },
      {
        key: 'address',
        title: $t('page.manage.customer.detail.stAddress'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'city',
        title: $t('page.manage.customer.detail.stCity'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'state',
        title: $t('page.manage.customer.detail.stState'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'mobile',
        title: $t('page.manage.customer.detail.stMobile'),
        visible: true,
        width: 100,
        sortable: false
      },
      {
        key: 'zip',
        title: $t('page.manage.customer.detail.stZip'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'taxNo',
        title: $t('page.manage.customer.detail.stTaxNo'),
        visible: true,
        width: 100,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-business-ship-to'
});

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  searchParams.keyword = '';
  handleSearch();
}

const configVisible = ref(false);
const operateRef = ref<InstanceType<typeof ShipToOperateDrawer>>();

function openCreate() {
  operateRef.value?.open();
}

function openEdit(row: Api.SystemManage.CustomerAddress) {
  operateRef.value?.open(row);
}

async function handleDelete(row: Api.SystemManage.CustomerAddress) {
  const { error } = await fetchDeleteShipTo([row._id]);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  getData();
}
</script>

<template>
  <div class="h-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-checkbox="true"
      :show-action="true"
      :action-width="110"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="searchParams.keyword"
            class="w-260px!"
            :placeholder="$t('page.manage.customer.detail.addressSearchPlaceholder')"
            @keyup.enter="handleSearch"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
      </template>

      <template #operation-left>
        <NButton size="small" type="primary" ghost @click="openCreate">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          {{ $t('common.add') }}
        </NButton>
      </template>

      <template #operation-right>
        <NSpace justify="end" wrap>
          <NButton size="small" @click="getData">
            <template #icon>
              <icon-mdi-refresh class="text-icon" />
            </template>
          </NButton>
        </NSpace>
      </template>

      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="handleDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ShipToOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
