<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateCountry,
  fetchDeleteCountry,
  fetchGetCountryList,
  fetchUpdateCountry,
  type CountryQueryResult
} from '@/service/api/data-manage-basic';
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

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BasicCountryRegion>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BasicCountryRegion> {
  return { code: '', nameCn: '', nameEn: '', name: '', code2: '', code3: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.basic.countryRegion.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.basic.countryRegion.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.basic.countryRegion.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.countryRegion.form.codePlaceholder')
  },
  {
    key: 'nameCn',
    label: $t('page.dataManage.basic.countryRegion.nameCn'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.countryRegion.form.nameCnPlaceholder')
  },
  { key: 'nameEn', label: $t('page.dataManage.basic.countryRegion.nameEn'), type: 'input', span: 12 },
  { key: 'name', label: $t('page.dataManage.basic.countryRegion.name'), type: 'input', span: 12 },
  { key: 'code2', label: $t('page.dataManage.basic.countryRegion.code2'), type: 'input', span: 12 },
  { key: 'code3', label: $t('page.dataManage.basic.countryRegion.code3'), type: 'input', span: 12 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: BasicCountryRegion) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    nameCn: row.nameCn,
    nameEn: row.nameEn,
    name: row.name,
    code2: row.code2,
    code3: row.code3
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateCountry(formModel.value)
        : await fetchUpdateCountry(formModel.value);
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
        <span>{{ formatDateTime((row as BasicCountryRegion).createDate) }}</span>
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
        <NButton size="small" type="primary" text @click="openEdit(row as BasicCountryRegion)">
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
