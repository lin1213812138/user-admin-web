<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteTraceTransform, fetchGetTraceTransformList } from '@/service/api/trace-transform';
import TraceTransformDrawer from './TraceTransformDrawer.vue';

/** 时间格式枚举 → 展示文案（走 i18n，不落库中文串） */
const timeTypeLabels: Record<Api.SystemManage.TraceTransformTimeType, string> = {
  0: $t('page.manage.setting.traceCapture.timeFormatOption.ymd'),
  1: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHm'),
  2: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHms')
};

/** 表格单元格展示时间格式文案（row 来自 vxe-table，入参按 number 收窄；非法值兜底占位符） */
function timeTypeLabel(value: number) {
  return timeTypeLabels[value as Api.SystemManage.TraceTransformTimeType] || '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceTransformList,
  Api.SystemManage.TraceTransformItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetTraceTransformList({ current, size });
    if (error || !res) return { list: [] };
    return res;
  },
  // 后端 queryAllCommon 全量返回（忽略分页），total 取列表长度仅作分页器展示
  transform: r => ({ records: r.list, total: r.list.length }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.traceCapture.col.statusName'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'timeType',
        title: $t('page.manage.setting.traceCapture.col.timeFormat'),
        visible: true,
        width: 180,
        sortable: false
      },
      {
        key: 'place',
        title: $t('page.manage.setting.traceCapture.col.location'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'desc',
        title: $t('page.manage.setting.traceCapture.col.description'),
        visible: true,
        minWidth: 220,
        sortable: false
      },
      {
        key: 'detectDesc',
        title: $t('page.manage.setting.traceCapture.col.keywordDefinition'),
        visible: true,
        minWidth: 220,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'trace-transform-v2'
});

const configVisible = ref(false);

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceTransformItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}

function openEdit(row: Api.SystemManage.TraceTransformItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

/** 后端 delete 仅单条 _id */
async function handleDelete(row: Api.SystemManage.TraceTransformItem) {
  const { error } = await fetchDeleteTraceTransform(row._id);
  if (error) return;
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
          <LButton type="primary" ghost @click="openCreate">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            {{ $t('page.manage.setting.traceCapture.addRow') }}
          </LButton>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton circle :tooltip="$t('common.refresh')" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </LButton>
          </NSpace>
        </template>

        <template #timeType="{ row }">{{ timeTypeLabel(row.timeType) }}</template>
        <template #place="{ row }">{{ row.place || '--' }}</template>
        <template #desc="{ row }">{{ row.desc || '--' }}</template>
        <template #detectDesc="{ row }">{{ row.detectDesc || '--' }}</template>

        <template #action="{ row }">
          <LButton type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</LButton>
          <LButton type="error" text popconfirm @positive-click="handleDelete(row)">{{ $t('common.delete') }}</LButton>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <TraceTransformDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
  </div>
</template>
