<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateBlAddress,
  fetchDeleteBlAddress,
  fetchGetBlAddressList,
  fetchUpdateBlAddress
} from '@/service/api/data-manage-bl';

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

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageBl.BlAddress>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<Api.DataManageBl.BlAddress> {
  return {
    addressType: activeType.value,
    name: '',
    company: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    email: '',
    eori: '',
    vat: '',
    countryId: '',
    note: ''
  };
}
const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blAddress.title')}`
);
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'addressType',
    label: '地址类型',
    type: 'select',
    required: true,
    span: 12,
    options: addressTypeOptions.value,
    disabled: drawerMode.value === 'edit'
  },
  {
    key: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.namePlaceholder')
  },
  {
    key: 'company',
    label: '公司',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.companyPlaceholder')
  },
  {
    key: 'phone',
    label: '电话',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.phonePlaceholder')
  },
  { key: 'countryId', label: '国家', type: 'input', span: 12 },
  {
    key: 'city',
    label: '城市',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.cityPlaceholder')
  },
  {
    key: 'state',
    label: '省州',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.statePlaceholder')
  },
  {
    key: 'zip',
    label: '邮编',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.zipPlaceholder')
  },
  {
    key: 'address',
    label: '地址',
    type: 'textarea',
    span: 24,
    placeholder: $t('page.dataManage.bl.blAddress.form.addressPlaceholder')
  },
  { key: 'email', label: '邮箱', type: 'input', span: 12 },
  { key: 'eori', label: 'EORI', type: 'input', span: 12 },
  { key: 'vat', label: 'VAT', type: 'input', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);
function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: Api.DataManageBl.BlAddress) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    addressType: row.addressType,
    name: row.name,
    company: row.company ?? '',
    phone: row.phone ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    eori: row.eori ?? '',
    vat: row.vat ?? '',
    countryId: row.countryId ?? '',
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
        ? await fetchCreateBlAddress(formModel.value)
        : await fetchUpdateBlAddress(formModel.value);
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
        <div class="flex flex-col gap-12px">
          <NRadioGroup v-model:value="activeType" type="button">
            <NRadioButton v-for="opt in addressTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
          <div class="flex flex-wrap items-center gap-12px">
            <NInput
              v-model:value="keyword"
              class="w-200px!"
              clearable
              :placeholder="$t('page.dataManage.bl.blAddress.form.namePlaceholder')"
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
        </div>
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
