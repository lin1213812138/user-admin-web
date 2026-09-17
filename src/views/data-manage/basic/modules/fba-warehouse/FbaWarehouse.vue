<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateFbaWarehouse,
  fetchDeleteFbaWarehouse,
  fetchGetCountryList,
  fetchGetFbaWarehouseList,
  fetchUpdateFbaWarehouse,
  type FbaWarehouseQueryResult
} from '@/service/api/data-manage-basic';

type BasicFbaWarehouse = Api.DataManage.BasicFbaWarehouse;

const keyword = ref('');

/** 所属国家下拉选项：来自国家地区（/country/query） */
const countryOptions = ref<SelectOption[]>([]);
const countryNameMap = ref<Record<string, string>>({});

async function loadCountryOptions() {
  const { data, error } = await fetchGetCountryList({ page: 1, size: 1000 });
  if (error || !data) return;
  countryOptions.value = data.list.map(item => ({ label: item.nameCn, value: item._id }));
  countryNameMap.value = Object.fromEntries(data.list.map(item => [item._id, item.nameCn]));
}
onMounted(loadCountryOptions);

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

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BasicFbaWarehouse>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BasicFbaWarehouse> {
  return { code: '', warehouse: '', name: '', phone: '', countryId: '', city: '', state: '', zip: '', address: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.basic.fbaWarehouse.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.basic.fbaWarehouse.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.basic.fbaWarehouse.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.form.codePlaceholder')
  },
  {
    key: 'warehouse',
    label: $t('page.dataManage.basic.fbaWarehouse.warehouse'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.form.warehousePlaceholder')
  },
  { key: 'name', label: $t('page.dataManage.basic.fbaWarehouse.name'), type: 'input', span: 12 },
  { key: 'phone', label: $t('page.dataManage.basic.fbaWarehouse.phone'), type: 'input', span: 12 },
  {
    key: 'countryId',
    label: $t('page.dataManage.basic.fbaWarehouse.country'),
    type: 'select',
    span: 12,
    clearable: true,
    options: countryOptions.value,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.country')
  },
  { key: 'city', label: $t('page.dataManage.basic.fbaWarehouse.city'), type: 'input', span: 12 },
  { key: 'state', label: $t('page.dataManage.basic.fbaWarehouse.state'), type: 'input', span: 12 },
  { key: 'zip', label: $t('page.dataManage.basic.fbaWarehouse.zip'), type: 'input', span: 12 },
  { key: 'address', label: $t('page.dataManage.basic.fbaWarehouse.address'), type: 'input', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: BasicFbaWarehouse) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    warehouse: row.warehouse,
    name: row.name,
    phone: row.phone,
    countryId: row.countryId,
    city: row.city,
    state: row.state,
    zip: row.zip,
    address: row.address
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    // 后端 Fba 同时存 countryId 与 country（名称），提交时由选中项反查名称
    const payload = { ...formModel.value, country: countryNameMap.value[formModel.value.countryId ?? ''] ?? '' };
    const { error } =
      drawerMode.value === 'create' ? await fetchCreateFbaWarehouse(payload) : await fetchUpdateFbaWarehouse(payload);
    if (error) return;
    drawerVisible.value = false;
    getData();
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}
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
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            :placeholder="$t('common.keyword')"
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
      <template #createDate="{ row }">
        <span>{{ formatDateTime((row as BasicFbaWarehouse).createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
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
        <NButton size="small" type="primary" text @click="openEdit(row as BasicFbaWarehouse)">
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

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :confirm-text="$t('common.save')"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
    </Drawer>
  </div>
</template>
