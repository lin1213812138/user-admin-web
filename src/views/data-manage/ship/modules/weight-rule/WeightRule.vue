<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateWeightRule,
  fetchDeleteWeightRule,
  fetchGetWeightRuleList,
  fetchUpdateWeightRule
} from '@/service/api/data-manage-ship';

/** 名称搜索关键字 */
const keyword = ref('');

/** 计算方式（后端新增字段 calcMode：0-按公斤 1-按方） */
const calcModeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byKg'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byCubic'), value: 1 }
]);

/** 计泡类型（后端固定枚举 mode 0-3） */
const modeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.modeOption.m0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m3'), value: 3 }
]);

/** 进位规则类型（carry 0-3） */
const carryOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.carryOption.c0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c3'), value: 3 }
]);

/** 计泡类型列展示文案 */
function modeLabel(mode?: number) {
  return modeOptions.value.find(item => item.value === mode)?.label ?? '';
}

/** 计算方式列展示文案 */
function calcModeLabel(calcMode?: number) {
  return calcModeOptions.value.find(item => item.value === calcMode)?.label ?? '';
}

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.WeightRule>,
  Api.DataManageShip.WeightRule
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetWeightRuleList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: {}
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.ship.weightRule.title'),
        type: 'detail',
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'calcMode',
        title: $t('page.dataManage.ship.weightRule.calcMode'),
        visible: true,
        width: 110,
        sortable: false
      },
      { key: 'mode', title: $t('page.dataManage.ship.weightRule.mode'), visible: true, minWidth: 200, sortable: false },
      {
        key: 'weightOff',
        title: $t('page.dataManage.ship.weightRule.weightOff'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'cubicNum',
        title: $t('page.dataManage.ship.weightRule.cubicNum'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.ship.weightRule.order'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-weight-rule'
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

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.WeightRule[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.WeightRule[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.WeightRule) {
  const { error } = await fetchDeleteWeightRule(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteWeightRule(row._id);
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
const formModel = ref<Partial<Api.DataManageShip.WeightRule>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Api.DataManageShip.WeightRule> {
  return {
    name: '',
    calcMode: 0,
    mode: 0,
    weightOff: undefined,
    cubicNum: undefined,
    order: 0,
    note: '',
    carryList: []
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.weightRule.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.weightRule.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.ship.weightRule.title'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入规则名称'
  },
  {
    key: 'calcMode',
    label: $t('page.dataManage.ship.weightRule.calcMode'),
    type: 'select',
    required: true,
    span: 12,
    options: calcModeOptions.value,
    filterable: false
  },
  {
    key: 'mode',
    label: $t('page.dataManage.ship.weightRule.mode'),
    type: 'select',
    span: 12,
    options: modeOptions.value,
    filterable: false
  },
  { key: 'weightOff', label: $t('page.dataManage.ship.weightRule.weightOff'), type: 'number', span: 12 },
  { key: 'cubicNum', label: $t('page.dataManage.ship.weightRule.cubicNum'), type: 'number', span: 12 },
  { key: 'order', label: $t('page.dataManage.ship.weightRule.order'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

// ---- 进位规则组动态编辑（嵌套结构，不走 FormWrap） ----
function addCarryGroup() {
  if (!formModel.value.carryList) formModel.value.carryList = [];
  formModel.value.carryList.push({ carry: 0, ruleList: [] });
}

function removeCarryGroup(index: number) {
  formModel.value.carryList?.splice(index, 1);
}

function addRule(carryIndex: number) {
  const group = formModel.value.carryList?.[carryIndex];
  if (!group) return;
  if (!group.ruleList) group.ruleList = [];
  group.ruleList.push({ start: undefined, end: undefined, unit: undefined });
}

function removeRule(carryIndex: number, ruleIndex: number) {
  formModel.value.carryList?.[carryIndex]?.ruleList?.splice(ruleIndex, 1);
}

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Api.DataManageShip.WeightRule) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    calcMode: row.calcMode ?? 0,
    mode: row.mode ?? 0,
    weightOff: row.weightOff,
    cubicNum: row.cubicNum,
    order: row.order ?? 0,
    note: row.note ?? '',
    carryList: (row.carryList ?? []).map(group => ({
      carry: group.carry,
      ruleList: (group.ruleList ?? []).map(rule => ({ start: rule.start, end: rule.end, unit: rule.unit }))
    }))
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
        ? await fetchCreateWeightRule(formModel.value)
        : await fetchUpdateWeightRule(formModel.value);

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
      <template #calcMode="{ row }">
        <span>{{ calcModeLabel(row.calcMode) }}</span>
      </template>
      <template #mode="{ row }">
        <span>{{ modeLabel(row.mode) }}</span>
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
      <div class="mt-16px">
        <div class="mb-8px font-bold">{{ $t('page.dataManage.ship.weightRule.carry') }}</div>
        <div
          v-for="(carry, ci) in formModel.carryList"
          :key="ci"
          class="mb-12px border border-[var(--n-border-color)] rd-4px p-12px"
        >
          <div class="mb-8px flex items-center gap-8px">
            <NSelect v-model:value="carry.carry" :options="carryOptions" class="min-w-240px" />
            <NButton quaternary type="error" size="small" @click="removeCarryGroup(ci)">
              {{ $t('page.dataManage.ship.weightRule.removeCarryGroup') }}
            </NButton>
          </div>
          <div v-for="(rule, ri) in carry.ruleList" :key="ri" class="mb-8px flex items-center gap-8px">
            <NInputNumber
              v-model:value="rule.start"
              class="w-150px!"
              :placeholder="$t('page.dataManage.ship.weightRule.start')"
            />
            <NInputNumber
              v-model:value="rule.end"
              class="w-150px!"
              :placeholder="$t('page.dataManage.ship.weightRule.end')"
            />
            <NInputNumber
              v-model:value="rule.unit"
              class="w-150px!"
              :placeholder="$t('page.dataManage.ship.weightRule.unit')"
            />
            <NButton quaternary type="error" size="small" @click="removeRule(ci, ri)">
              {{ $t('page.dataManage.ship.weightRule.removeRule') }}
            </NButton>
          </div>
          <NButton dashed size="small" @click="addRule(ci)">
            {{ $t('page.dataManage.ship.weightRule.addRule') }}
          </NButton>
        </div>
        <NButton dashed size="small" @click="addCarryGroup">
          {{ $t('page.dataManage.ship.weightRule.addCarryGroup') }}
        </NButton>
      </div>
    </Drawer>
  </div>
</template>
