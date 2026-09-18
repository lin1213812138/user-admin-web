<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteNoRule, fetchGetNoRuleList } from '@/service/api/no-rule';
import NoRuleSearchForm from './NoRuleSearchForm.vue';
import NoRuleOperateDrawer from './NoRuleOperateDrawer.vue';

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

const drawerRef = ref<InstanceType<typeof NoRuleOperateDrawer> | null>(null);
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
        <NoRuleSearchForm
          v-model:filter-sys-type="filterSysType"
          :options="sysTypeOptions"
          @search="handleSearch"
          @reset="handleReset"
        />
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
        <NButton type="primary" ghost size="small" @click="drawerRef?.openCreate()">
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
        <NButton text type="primary" @click="drawerRef?.openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NTooltip v-if="isSysTypeRule(row)" trigger="hover">
          <template #trigger>
            <NButton text type="error" disabled>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('page.dataManage.noRule.sysTypeForbidDelete') }}
        </NTooltip>
        <NButton v-else text type="error" @click="handleDelete(row)">{{ $t('common.delete') }}</NButton>
      </template>
    </Table>

    <NoRuleOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
