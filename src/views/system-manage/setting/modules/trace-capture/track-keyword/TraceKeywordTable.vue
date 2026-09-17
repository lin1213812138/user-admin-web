<script setup lang="ts">
import { onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NTag } from 'naive-ui';
import { fetchDeleteTraceKeyword, fetchGetTraceKeywordList } from '@/service/api/trace-keyword';
import { fetchGetTrackConfigList } from '@/service/api/track-config';
import TraceKeywordDrawer from './TraceKeywordDrawer.vue';

/** 运单状态枚举 → 展示文案（走 i18n，不落库中文串） */
const orderStatusLabels: Record<Api.SystemManage.TraceKeywordOrderStatus, string> = {
  50: $t('page.manage.setting.traceCapture.waybillStatusOption.inTransit'),
  60: $t('page.manage.setting.traceCapture.waybillStatusOption.delivered'),
  70: $t('page.manage.setting.traceCapture.waybillStatusOption.exception'),
  80: $t('page.manage.setting.traceCapture.waybillStatusOption.returned')
};

/** 表格单元格展示枚举文案（row 来自 vxe-table，入参按 number 收窄；非法值兜底占位符） */
function orderStatusLabel(value: number) {
  return orderStatusLabels[value as Api.SystemManage.TraceKeywordOrderStatus] || '--';
}

/** 追踪网络全量缓存：表格 configIds 名称映射 + 抽屉多选下拉共用 */
type TrackConfigOption = { label: string; value: string };
const trackConfigOptions = ref<TrackConfigOption[]>([]);

async function loadTrackConfigOptions() {
  const { data: res, error } = await fetchGetTrackConfigList({});
  if (error || !res) return;
  trackConfigOptions.value = res.list.map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadTrackConfigOptions();
});

/** 列表列展示关联追踪网络名称（多个用「、」连接） */
function trackConfigNames(ids?: string[]) {
  if (!ids || ids.length === 0) return '--';
  const names = ids.map(id => trackConfigOptions.value.find(item => item.value === id)?.label ?? id);
  return names.join('、');
}

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceKeywordList,
  Api.SystemManage.TraceKeywordItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetTraceKeywordList({ page: current, size });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.traceCapture.col.ruleName'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'common',
        title: $t('page.manage.setting.traceCapture.col.common'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'configIds',
        title: $t('page.manage.setting.traceCapture.col.trackNetworks'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'detectEvents',
        title: $t('page.manage.setting.traceCapture.col.keywordGroup'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'orderStatus',
        title: $t('page.manage.setting.traceCapture.col.waybillStatus'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'updateBy',
        title: $t('page.manage.setting.traceCapture.col.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.manage.setting.traceCapture.col.editTime'),
        visible: true,
        width: 170,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'trace-keyword-v2'
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

/** 后端 delete 仅单条 _id */
async function handleDelete(row: Api.SystemManage.TraceKeywordItem) {
  const { error } = await fetchDeleteTraceKeyword(row._id);
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

        <template #common="{ row }">
          <NTag v-if="row.common === 1" size="small" type="success">{{ $t('common.yesOrNo.yes') }}</NTag>
          <NTag v-else size="small" type="default">{{ $t('common.yesOrNo.no') }}</NTag>
        </template>
        <template #configIds="{ row }">{{ trackConfigNames(row.configIds) }}</template>
        <template #detectEvents="{ row }">{{ row.detectEvents?.length ? row.detectEvents.join('、') : '--' }}</template>
        <template #orderStatus="{ row }">{{ orderStatusLabel(row.orderStatus) }}</template>
        <template #updateBy="{ row }">{{ row.updateBy || '--' }}</template>
        <template #updateDate="{ row }">{{ formatDateTime(row.updateDate) }}</template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
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

    <TraceKeywordDrawer
      v-model:show="drawerVisible"
      :mode="drawerMode"
      :row="drawerRow"
      :track-config-options="trackConfigOptions"
      @submitted="getData"
    />
  </div>
</template>
