<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteCustomer, fetchGetCustomerList } from '@/service/api/customer';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import CustomerOperateDrawer from './modules/customer-operate-drawer.vue';

const searchParams = reactive<Omit<Api.SystemManage.CustomerSearchParams, 'current' | 'size'>>({
  customerCode: '',
  customerName: '',
  customerLevel: null,
  status: null
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 客户等级 / 来源下拉选项（与抽屉共用口径） */
const customerLevelOptions = computed<CommonType.Option<Api.SystemManage.CustomerLevel>[]>(() => [
  { label: $t('page.manage.customer.levelNormal'), value: 'normal' },
  { label: $t('page.manage.customer.levelImportant'), value: 'important' },
  { label: $t('page.manage.customer.levelVip'), value: 'vip' }
]);

const customerSourceOptions = computed<CommonType.Option<Api.SystemManage.CustomerSource>[]>(() => [
  { label: $t('page.manage.customer.sourceWebsite'), value: 'website' },
  { label: $t('page.manage.customer.sourceReferral'), value: 'referral' },
  { label: $t('page.manage.customer.sourceAd'), value: 'ad' }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'customerCode',
    label: $t('page.manage.customer.customerCode'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.customer.form.customerCodePlaceholder')
  },
  {
    key: 'customerName',
    label: $t('page.manage.customer.customerName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.customer.form.customerNamePlaceholder')
  },
  {
    key: 'customerLevel',
    label: $t('page.manage.customer.customerLevel'),
    type: 'select',
    span: 6,
    options: customerLevelOptions.value,
    placeholder: $t('page.manage.customer.form.customerLevelPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.customer.form.statusPlaceholder')
  }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.CustomerList,
  Api.SystemManage.Customer
>({
  api: ({ current, size }) =>
    fetchGetCustomerList({
      current,
      size,
      customerCode: searchParams.customerCode?.trim() || undefined,
      customerName: searchParams.customerName?.trim() || undefined,
      // 等级 / 状态 0 都是有效值，须用 ?? 兜底而不是 ||
      customerLevel: searchParams.customerLevel ?? undefined,
      status: searchParams.status ?? undefined
    }) as Promise<Api.SystemManage.CustomerList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'customerCode',
        title: $t('page.manage.customer.customerCode'),
        type: 'detail',
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'customerName',
        title: $t('page.manage.customer.customerName'),
        visible: true,
        width: 140,
        sortable: false
      },
      {
        key: 'customerLevel',
        title: $t('page.manage.customer.customerLevel'),
        visible: true,
        width: 100,
        sortable: false
      },
      {
        key: 'customerSource',
        title: $t('page.manage.customer.customerSource'),
        visible: true,
        width: 100,
        sortable: false
      },
      { key: 'contactName', title: $t('page.manage.customer.contactName'), visible: true, width: 100, sortable: false },
      {
        key: 'contactPhone',
        title: $t('page.manage.customer.contactPhone'),
        visible: true,
        width: 140,
        sortable: false
      },
      { key: 'email', title: $t('page.manage.customer.email'), visible: false, minWidth: 180, sortable: false },
      { key: 'address', title: $t('page.manage.customer.address'), visible: false, minWidth: 200, sortable: false },
      {
        key: 'status',
        title: $t('page.manage.customer.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      },
      { key: 'updateTime', title: $t('page.manage.customer.updateTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  cacheKey: 'system-manage-customer'
});

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Customer[]>([]);

function handleSelectionChange(records: Api.SystemManage.Customer[]) {
  checkedRows.value = records;
}

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
  searchParams.customerCode = '';
  searchParams.customerName = '';
  searchParams.customerLevel = null;
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteCustomer(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Customer | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Customer) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.Customer) {
  openDrawer('detail', row);
}

function handleEdit(row: Api.SystemManage.Customer) {
  openDrawer('edit', row);
}

function handleSubmitted() {
  getData();
}

/** 等级 / 来源反查中文 label（表格插槽用） */
function levelLabel(level: Api.SystemManage.CustomerLevel): string {
  return customerLevelOptions.value.find(item => item.value === level)?.label ?? '';
}

function sourceLabel(source: Api.SystemManage.CustomerSource): string {
  return customerSourceOptions.value.find(item => item.value === source)?.label ?? '';
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-16px">
    <div class="flex-1 min-h-0">
      <Table
        :search-items="searchItems"
        :search-model="searchParams"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="120"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
        <template #customerLevel="{ row }">
          <span>{{ levelLabel(row.customerLevel) }}</span>
        </template>

        <template #customerSource="{ row }">
          <span>{{ sourceLabel(row.customerSource) }}</span>
        </template>

        <template #updateTime="{ row }">
          <span>{{ row.updateByName }} - {{ row.updateTime }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" ghost @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
            <NPopconfirm
              :disabled="checkedRows.length === 0"
              @positive-click="handleDelete(checkedRows.map(i => i.id))"
            >
              <template #trigger>
                <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
                  <template #icon>
                    <icon-mdi-delete class="text-icon" />
                  </template>
                  {{ $t('common.batchDelete') }}
                </NButton>
              </template>
              {{ $t('common.confirmDelete') }}
            </NPopconfirm>
          </NSpace>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </NButton>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="handleEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <CustomerOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
