<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { WaybillRule, WaybillRuleFormPayload } from './waybill-rule.model';
import WaybillRuleForm from './waybill-rule-form.vue';

const mockRules: WaybillRule[] = [
  {
    id: 1,
    code: 'RULE001',
    name: '默认运单号规则',
    prefix: 'YD',
    suffix: '',
    startValue: 1000,
    endValue: 9999,
    currentValue: 1025,
    digitLength: 4,
    checkDigit: 'close',
    status: 1,
    createTime: '2026-01-01 10:00'
  },
  {
    id: 2,
    code: 'RULE002',
    name: '专线运单号规则',
    prefix: 'ZX',
    suffix: '',
    startValue: 5000,
    endValue: 9999,
    currentValue: 5033,
    digitLength: 4,
    checkDigit: 'close',
    status: 1,
    createTime: '2026-02-15 14:30'
  },
  {
    id: 3,
    code: 'RULE003',
    name: '测试运单号规则',
    prefix: 'CS',
    suffix: '',
    startValue: 1,
    endValue: 99,
    currentValue: 8,
    digitLength: 2,
    checkDigit: 'close',
    remark: '测试用',
    status: 0,
    createTime: '2026-03-20 09:12'
  }
];

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  { records: WaybillRule[]; total: number },
  WaybillRule
>({
  api: () => Promise.resolve({ records: mockRules, total: mockRules.length }),
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'code', title: '编号', visible: true, sortable: false, width: 120 },
      { key: 'name', title: '规则名称', type: 'detail', visible: true, sortable: false },
      { key: 'prefix', title: '前缀', visible: true, sortable: false, width: 80 },
      { key: 'suffix', title: '后缀', visible: true, sortable: false, width: 80 },
      { key: 'startValue', title: '起始值', visible: true, sortable: false, width: 90 },
      { key: 'endValue', title: '结束值', visible: true, sortable: false, width: 90 },
      { key: 'currentValue', title: '当前值', visible: true, sortable: false, width: 90 },
      { key: 'digitLength', title: '数字位数', visible: true, sortable: false, width: 100 },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      { key: 'createTime', title: '创建时间', visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-setting-waybill-rule'
});

const configVisible = ref(false);

// ---- 新建/编辑交给独立组件 WaybillRuleForm（列表与表单解耦） ----
const drawerVisible = ref(false);
const editRow = ref<WaybillRule | null>(null);

function openCreate() {
  editRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: WaybillRule) {
  editRow.value = row;
  drawerVisible.value = true;
}
function handleSubmit(payload: WaybillRuleFormPayload) {
  if (editRow.value) {
    data.value = data.value.map(item => (item.id === editRow.value!.id ? { ...item, ...payload } : item));
    window.$message?.success('保存成功');
  } else {
    const newRule: WaybillRule = {
      ...payload,
      id: Date.now(),
      status: 1,
      createTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    data.value = [newRule, ...data.value];
    pagination.total += 1;
    window.$message?.success('新建成功');
  }
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
function handleDelete(row: WaybillRule) {
  data.value = data.value.filter(item => item.id !== row.id);
  pagination.total = Math.max(0, pagination.total - 1);
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
      :show-checkbox="true"
      :show-action="true"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #operation-left>
        <NSpace justify="start" wrap>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </NSpace>
      </template>
      <template #operation-right>
        <NSpace justify="end" wrap>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
          <NButton size="small" @click="getData">
            <template #icon><icon-mdi-refresh class="text-icon" /></template>
          </NButton>
        </NSpace>
      </template>
      <template #action="{ row }">
        <NSpace justify="center">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Table>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />

    <WaybillRuleForm v-model:show="drawerVisible" :row="editRow" @submit="handleSubmit" />
  </div>
</template>
