<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateLongNoRule,
  fetchDeleteLongNoRule,
  fetchGetLongNoRuleList,
  fetchUpdateLongNoRule,
  type LongNoRule as LongNoRuleItem
} from '@/service/api/data-manage-no-rule';

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
  { list: LongNoRuleItem[]; total: number },
  LongNoRuleItem
>({
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = {};
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetLongNoRuleList({
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
      { key: 'name', title: '规则名称', type: 'detail', visible: true, minWidth: 160, sortable: false },
      { key: 'oriLen', title: '原始长度', visible: true, width: 120, align: 'right', sortable: false },
      { key: 'start', title: '截取开始位置', visible: true, width: 140, align: 'right', sortable: false },
      { key: 'len', title: '截取长度', visible: true, width: 120, align: 'right', sortable: false },
      { key: 'rule', title: '单号掩码', visible: true, minWidth: 180, sortable: false },
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
  cacheKey: 'data-manage-no-rule-long'
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

const checkedRows = ref<LongNoRuleItem[]>([]);
function handleSelectionChange(rows: LongNoRuleItem[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: LongNoRuleItem) {
  const { error } = await fetchDeleteLongNoRule(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteLongNoRule(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<LongNoRuleItem>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<LongNoRuleItem> {
  return { name: '', oriLen: 0, start: 0, len: 0, rule: '', status: 1, note: '' };
}
const drawerTitle = computed(() => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}长单号截短`);
const formItems = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '规则名称', type: 'input', required: true, span: 24 },
  { key: 'oriLen', label: '原始长度', type: 'number', required: true, span: 12 },
  { key: 'start', label: '截取开始位置', type: 'number', required: true, span: 12 },
  { key: 'len', label: '截取长度', type: 'number', required: true, span: 12 },
  { key: 'rule', label: '单号掩码', type: 'input', span: 24 },
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
function openEdit(row: LongNoRuleItem) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    oriLen: row.oriLen,
    start: row.start,
    len: row.len,
    rule: row.rule ?? '',
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
        ? await fetchCreateLongNoRule(formModel.value)
        : await fetchUpdateLongNoRule(formModel.value);
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
            placeholder="请输入规则名称"
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
