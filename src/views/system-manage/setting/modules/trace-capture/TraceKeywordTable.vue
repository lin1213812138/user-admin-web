<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NTag } from 'naive-ui';
import { fetchDeleteTraceKeyword, fetchGetTraceKeywordList } from '@/service/api/system-manage';
import TraceKeywordDrawer from './TraceKeywordDrawer.vue';

/** 使用范围枚举 → 展示文案（走 i18n，不落库中文串） */
const scopeLabels: Record<Api.SystemManage.TraceKeywordScope, string> = {
  global: $t('page.manage.setting.traceCapture.scopeOption.global'),
  site: $t('page.manage.setting.traceCapture.scopeOption.site'),
  customer: $t('page.manage.setting.traceCapture.scopeOption.customer')
};

/** 运单状态枚举 → 展示文案 */
const waybillStatusLabels: Record<Api.SystemManage.TraceKeywordWaybillStatus, string> = {
  'in-transit': $t('page.manage.setting.traceCapture.waybillStatusOption.inTransit'),
  delivered: $t('page.manage.setting.traceCapture.waybillStatusOption.delivered'),
  exception: $t('page.manage.setting.traceCapture.waybillStatusOption.exception'),
  returned: $t('page.manage.setting.traceCapture.waybillStatusOption.returned')
};

/** 表格单元格展示枚举文案（row 来自 vxe-table，入参按 string 收窄；非法值兜底占位符） */
function scopeLabel(value: string) {
  return scopeLabels[value as Api.SystemManage.TraceKeywordScope] || '--';
}

function waybillStatusLabel(value: string) {
  return waybillStatusLabels[value as Api.SystemManage.TraceKeywordWaybillStatus] || '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceKeywordList,
  Api.SystemManage.TraceKeywordItem
>({
  api: ({ current, size }) => fetchGetTraceKeywordList({ current, size }) as Promise<Api.SystemManage.TraceKeywordList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'ruleName',
        title: $t('page.manage.setting.traceCapture.col.ruleName'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'scope',
        title: $t('page.manage.setting.traceCapture.col.scope'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'keywordGroup',
        title: $t('page.manage.setting.traceCapture.col.keywordGroup'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'waybillStatus',
        title: $t('page.manage.setting.traceCapture.col.waybillStatus'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'enabled',
        title: $t('page.manage.setting.traceCapture.col.enabled'),
        visible: true,
        width: 110,
        align: 'center',
        sortable: false
      },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.traceCapture.col.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.traceCapture.col.editTime'),
        visible: true,
        width: 170,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'trace-keyword'
});

const configVisible = ref(false);

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceKeywordItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}

function openEdit(row: Api.SystemManage.TraceKeywordItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteTraceKeyword(ids);
  window.$message?.success($t('common.deleteSuccess'));
  getData();
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="120"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            {{ $t('page.manage.setting.traceCapture.addRow') }}
          </NButton>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </NButton>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>

        <template #scope="{ row }">{{ scopeLabel(row.scope) }}</template>
        <template #waybillStatus="{ row }">{{ waybillStatusLabel(row.waybillStatus) }}</template>
        <template #enabled="{ row }">
          <NTag v-if="row.enabled === 1" size="small" type="success">{{ $t('common.enable') }}</NTag>
          <NTag v-else size="small" type="default">{{ $t('common.disable') }}</NTag>
        </template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <TraceKeywordDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
  </div>
</template>
