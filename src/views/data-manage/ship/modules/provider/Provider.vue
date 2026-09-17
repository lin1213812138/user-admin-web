<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateProvider,
  fetchDeleteProvider,
  fetchGetProviderList,
  fetchUpdateProvider
} from '@/service/api/data-manage-ship';

/** 服务商类型（后端固定枚举 0-发货 1-派送 2-提单 3-杂支） */
const providerTypeOptions = computed(() => [
  { label: $t('page.dataManage.ship.provider.typeOption.out'), value: 0 },
  { label: $t('page.dataManage.ship.provider.typeOption.send'), value: 1 },
  { label: $t('page.dataManage.ship.provider.typeOption.bl'), value: 2 },
  { label: $t('page.dataManage.ship.provider.typeOption.other'), value: 3 }
]);

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

/** 切换服务商类型：重置到第一页重查 */
function handleTypeChange() {
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

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageShip.Provider>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Api.DataManageShip.Provider> {
  return {
    code: '',
    name: '',
    billMode: '',
    contact: '',
    phone: '',
    email: '',
    web: '',
    address: '',
    providerType: providerType.value,
    status: 1,
    note: ''
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.provider.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.provider.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'providerType',
    label: $t('page.dataManage.ship.provider.providerType'),
    type: 'select',
    required: true,
    span: 12,
    options: providerTypeOptions.value,
    filterable: false
  },
  {
    key: 'code',
    label: $t('page.dataManage.ship.provider.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商代码'
  },
  {
    key: 'name',
    label: $t('page.dataManage.ship.provider.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商名称'
  },
  { key: 'billMode', label: $t('page.dataManage.ship.provider.billMode'), type: 'input', span: 12 },
  { key: 'contact', label: $t('page.dataManage.ship.provider.contact'), type: 'input', span: 12 },
  { key: 'phone', label: $t('page.dataManage.ship.provider.phone'), type: 'input', span: 12 },
  { key: 'email', label: $t('page.dataManage.ship.provider.email'), type: 'input', span: 12 },
  { key: 'web', label: $t('page.dataManage.ship.provider.web'), type: 'input', span: 12 },
  { key: 'address', label: $t('page.dataManage.ship.provider.address'), type: 'input', span: 12 },
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

function openEdit(row: Api.DataManageShip.Provider) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    name: row.name,
    billMode: row.billMode ?? '',
    contact: row.contact ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    web: row.web ?? '',
    address: row.address ?? '',
    providerType: row.providerType,
    status: row.status,
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
        ? await fetchCreateProvider(formModel.value)
        : await fetchUpdateProvider(formModel.value);

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
          <NRadioGroup v-model:value="providerType" @update:value="handleTypeChange">
            <NRadioButton v-for="opt in providerTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            placeholder="请输入服务商名称"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="statusFilter"
            class="w-140px!"
            clearable
            :options="statusOptions"
            placeholder="状态"
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
