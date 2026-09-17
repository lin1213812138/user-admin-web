<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateBlTrip,
  fetchDeleteBlTrip,
  fetchGetBlTripList,
  fetchUpdateBlTrip
} from '@/service/api/data-manage-bl';

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
  Api.DataManageBl.BlQueryResult<Api.DataManageBl.BlTrip>,
  Api.DataManageBl.BlTrip
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = {};
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetBlTripList({
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
        title: $t('page.dataManage.bl.blTrip.voyage'),
        type: 'detail',
        visible: true,
        minWidth: 140,
        sortable: false
      },
      { key: 'shipDate', title: '离港时间', visible: true, width: 140, sortable: false },
      { key: 'arrivalDate', title: '到港时间', visible: true, width: 140, sortable: false },
      { key: 'days', title: '航程天数', visible: true, width: 110, align: 'right', sortable: false },
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
  cacheKey: 'data-manage-bl-trip'
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

const checkedRows = ref<Api.DataManageBl.BlTrip[]>([]);
function handleSelectionChange(rows: Api.DataManageBl.BlTrip[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: Api.DataManageBl.BlTrip) {
  const { error } = await fetchDeleteBlTrip(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteBlTrip(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageBl.BlTrip>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<Api.DataManageBl.BlTrip> {
  return { code: '', shipDate: '', arrivalDate: '', days: undefined, status: 1, note: '' };
}
const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blTrip.title')}`
);
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.bl.blTrip.voyage'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.blTrip.form.voyagePlaceholder')
  },
  { key: 'shipDate', label: '离港时间', type: 'date', span: 12 },
  { key: 'arrivalDate', label: '到港时间', type: 'date', span: 12 },
  { key: 'days', label: '航程天数', type: 'number', span: 12 },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);
function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: Api.DataManageBl.BlTrip) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    shipDate: row.shipDate ?? '',
    arrivalDate: row.arrivalDate ?? '',
    days: row.days,
    status: row.status ?? 1,
    note: row.note ?? ''
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
        ? await fetchCreateBlTrip(formModel.value)
        : await fetchUpdateBlTrip(formModel.value);
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
            :placeholder="$t('page.dataManage.bl.blTrip.form.namePlaceholder')"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="statusFilter"
            class="w-140px!"
            clearable
            :options="statusOptions"
            :placeholder="$t('common.status')"
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
      <template #shipDate="{ row }">
        <span>{{ row.shipDate || '--' }}</span>
      </template>
      <template #arrivalDate="{ row }">
        <span>{{ row.arrivalDate || '--' }}</span>
      </template>
      <template #days="{ row }">
        <span>{{ row.days ?? '--' }}</span>
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
        <NButton type="primary" ghost size="small" @click="openCreate">
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
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
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
