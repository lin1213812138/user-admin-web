<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import type { FormItemRule, FormRules, SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateNoRule, fetchDeleteNoRule, fetchGetNoRuleList, fetchUpdateNoRule } from '@/service/api/no-rule';

/** 验证位选项（对齐后端 checkType） */
const checkTypeOptions: SelectOption[] = [
  { label: $t('page.dataManage.noRule.checkTypeOption.none'), value: 0 },
  { label: $t('page.dataManage.noRule.checkTypeOption.weighted'), value: 1 },
  { label: $t('page.dataManage.noRule.checkTypeOption.mod7'), value: 2 }
];

/** 系统类型选项（对齐后端 sysType；0 = 自定义） */
const sysTypeOptions: SelectOption[] = [
  { label: $t('page.dataManage.noRule.sysTypeOption.custom'), value: 0 },
  { label: $t('page.dataManage.noRule.sysTypeOption.waybill'), value: 1 },
  { label: $t('page.dataManage.noRule.sysTypeOption.customer'), value: 2 }
];

/** 按选项反查展示文案（未知值回退为空串） */
function optionLabel(options: SelectOption[], value?: number) {
  return options.find(item => item.value === value)?.label ?? '';
}

/** 系统类型展示文案（0 / 无值按「自定义」展示） */
function sysTypeLabel(value?: number) {
  return optionLabel(sysTypeOptions, value ?? 0);
}

/** 系统类型有值的记录后端不允许删除（BUILD_IN_ERROR），前端同步禁删 */
function isSysTypeRule(row: Api.NoRule.Item) {
  return !!row.sysType;
}

/** 毫秒时间戳 → 展示文案 */
function formatDateTime(ms?: number) {
  return ms ? dayjs(ms).format('YYYY-MM-DD HH:mm:ss') : '--';
}

/** 系统类型筛选（null = 全部；「自定义」= 0 或字段缺失，用 $in [0, null] 兜住两种数据） */
const filterSysType = ref<number | null>(null);

const whereFilter = computed<Record<string, unknown> | undefined>(() => {
  if (filterSysType.value == null) return undefined;
  if (filterSysType.value === 0) return { sysType: { $in: [0, null] } };

  return { sysType: filterSysType.value };
});

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.NoRule.List,
  Api.NoRule.Item
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetNoRuleList({
      page: current,
      size,
      where: whereFilter.value
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // 后端返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.noRule.name'),
        type: 'detail',
        visible: true,
        minWidth: 160,
        sortable: false
      },
      { key: 'prefix', title: $t('page.dataManage.noRule.prefix'), visible: true, width: 70, sortable: false },
      { key: 'suffix', title: $t('page.dataManage.noRule.suffix'), visible: true, width: 70, sortable: false },
      { key: 'start', title: $t('page.dataManage.noRule.start'), visible: true, width: 90, sortable: false },
      { key: 'end', title: $t('page.dataManage.noRule.end'), visible: true, width: 90, sortable: false },
      { key: 'current', title: $t('page.dataManage.noRule.current'), visible: true, width: 90, sortable: false },
      { key: 'len', title: $t('page.dataManage.noRule.len'), visible: true, width: 90, sortable: false },
      { key: 'checkType', title: $t('page.dataManage.noRule.checkType'), visible: true, width: 100, sortable: false },
      { key: 'sysType', title: $t('page.dataManage.noRule.sysType'), visible: true, width: 100, sortable: false },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 140, sortable: false },
      {
        key: 'updateBy',
        title: $t('page.dataManage.noRule.lastOperation'),
        visible: true,
        width: 110,
        fixed: 'right',
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.dataManage.noRule.lastUpdateTime'),
        visible: true,
        width: 170,
        fixed: 'right',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-no-rule'
});

const configVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  filterSysType.value = null;
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 新建 / 编辑抽屉 ----

/** 表单模型（输入类字段统一 string，下拉用 number） */
interface RuleFormModel {
  name: string;
  prefix: string;
  suffix: string;
  start: string;
  end: string;
  current: string;
  len: string;
  checkType: number;
  sysType: number;
  note: string;
}

function emptyForm(): RuleFormModel {
  return {
    name: '',
    prefix: '',
    suffix: '',
    start: '',
    end: '',
    current: '',
    len: '',
    checkType: 0,
    sysType: 0,
    note: ''
  };
}

const drawerVisible = ref(false);
const editRow = ref<Api.NoRule.Item | null>(null);
const formModel = ref<RuleFormModel>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  editRow.value ? $t('page.dataManage.noRule.editTitle') : $t('page.dataManage.noRule.newTitle')
);

/** 系统内置记录名称不可改（后端 update 时忽略 name） */
const nameDisabled = computed(() => editRow.value?.buildIn === 1);

/** 正整数校验：空值先提示输入、非法值提示正整数 */
function positiveIntRule(placeholder: string): FormItemRule {
  return {
    required: true,
    validator: (_rule, value) => {
      const text = String(value ?? '').trim();
      if (!text) return new Error(placeholder);
      if (!/^\d+$/.test(text)) return new Error($t('page.dataManage.noRule.form.positiveInt'));

      return undefined;
    }
  };
}

const formRules = computed<FormRules>(() => ({
  start: positiveIntRule($t('page.dataManage.noRule.form.startPlaceholder')),
  end: positiveIntRule($t('page.dataManage.noRule.form.endPlaceholder')),
  current: positiveIntRule($t('page.dataManage.noRule.form.currentPlaceholder')),
  len: positiveIntRule($t('page.dataManage.noRule.form.lenPlaceholder'))
}));

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.noRule.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.namePlaceholder'),
    disabled: nameDisabled.value
  },
  {
    key: 'prefix',
    label: $t('page.dataManage.noRule.prefix'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.prefixPlaceholder')
  },
  {
    key: 'suffix',
    label: $t('page.dataManage.noRule.suffix'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.suffixPlaceholder')
  },
  {
    key: 'start',
    label: $t('page.dataManage.noRule.start'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.startPlaceholder')
  },
  {
    key: 'end',
    label: $t('page.dataManage.noRule.end'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.endPlaceholder')
  },
  {
    key: 'current',
    label: $t('page.dataManage.noRule.current'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.currentPlaceholder')
  },
  {
    key: 'len',
    label: $t('page.dataManage.noRule.len'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.lenPlaceholder')
  },
  {
    key: 'checkType',
    label: $t('page.dataManage.noRule.checkType'),
    type: 'select',
    span: 12,
    options: checkTypeOptions,
    filterable: false
  },
  {
    key: 'sysType',
    label: $t('page.dataManage.noRule.sysType'),
    type: 'select',
    span: 12,
    options: sysTypeOptions,
    filterable: false
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.dataManage.noRule.form.notePlaceholder')
  }
]);

function openCreate() {
  editRow.value = null;
  formModel.value = emptyForm();
  drawerVisible.value = true;
}

function openEdit(row: Api.NoRule.Item) {
  editRow.value = row;
  formModel.value = {
    name: row.name ?? '',
    prefix: row.prefix ?? '',
    suffix: row.suffix ?? '',
    start: String(row.start ?? ''),
    end: String(row.end ?? ''),
    current: String(row.current ?? ''),
    len: row.len == null ? '' : String(row.len),
    checkType: row.checkType ?? 0,
    sysType: row.sysType ?? 0,
    note: row.note ?? ''
  };
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  const params: Api.NoRule.SaveParams = {
    name: formModel.value.name.trim(),
    start: formModel.value.start.trim(),
    end: formModel.value.end.trim(),
    current: formModel.value.current.trim(),
    len: Number(formModel.value.len),
    prefix: formModel.value.prefix.trim(),
    suffix: formModel.value.suffix.trim(),
    checkType: formModel.value.checkType as Api.NoRule.CheckType,
    sysType: formModel.value.sysType as Api.NoRule.SysType,
    note: formModel.value.note.trim()
  };

  if (editRow.value) {
    const { error } = await fetchUpdateNoRule({ _id: editRow.value._id, ...params });
    if (error) return;
  } else {
    const { error } = await fetchCreateNoRule(params);
    if (error) return;
  }

  drawerVisible.value = false;
  getData();
  window.$message?.success($t('common.saveSuccess'));
}

function handleDelete(row: Api.NoRule.Item) {
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchDeleteNoRule(row._id);
      if (error) return;
      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
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
      show-action
      :action-width="160"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <!-- 快速搜索栏：系统类型筛选 -->
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NSelect
            v-model:value="filterSysType"
            class="w-180px!"
            clearable
            :options="sysTypeOptions"
            :placeholder="$t('page.dataManage.noRule.sysTypeAll')"
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
      <template #checkType="{ row }">
        <span>{{ optionLabel(checkTypeOptions, row.checkType ?? 0) }}</span>
      </template>
      <template #sysType="{ row }">
        <span>{{ sysTypeLabel(row.sysType) }}</span>
      </template>
      <template #updateDate="{ row }">
        <span>{{ formatDateTime(row.updateDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="configVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton text type="primary" @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NTooltip v-if="isSysTypeRule(row)" trigger="hover">
          <template #trigger>
            <NButton text type="error" disabled>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('page.dataManage.noRule.sysTypeForbidDelete') }}
        </NTooltip>
        <NButton v-else text type="error" @click="handleDelete(row)">{{ $t('common.delete') }}</NButton>
      </template>
    </Table>

    <Drawer v-model:show="drawerVisible" :title="drawerTitle" :width="720" :footer="true" @submit="handleDrawerSubmit">
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" :rules="formRules" />
    </Drawer>
  </div>
</template>
