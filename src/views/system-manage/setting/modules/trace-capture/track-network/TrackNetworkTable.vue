<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton, NInput, NPopconfirm } from 'naive-ui';
import { fetchDeleteTrackConfig, fetchGetTrackConfigList } from '@/service/api/track-config';
import { trackTypeLabel } from '@/constants/track-config';
import TrackNetworkDrawer from './TrackNetworkDrawer.vue';
import TrackReplaceModal from './TrackReplaceModal.vue';

const props = defineProps<{ category: Api.SystemManage.TraceCaptureCategory }>();

const categoryTabKey: Record<
  Api.SystemManage.TraceCaptureCategory,
  'trackNetwork' | 'trackTransform' | 'trackKeyword' | 'captureTime'
> = {
  'track-network': 'trackNetwork',
  'track-transform': 'trackTransform',
  'track-keyword': 'trackKeyword',
  'capture-time': 'captureTime'
};

/** 名称搜索关键字（后端 /track-config/query 按 name 模糊匹配） */
const keyword = ref('');

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceConfigList,
  Api.SystemManage.TraceConfigItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetTrackConfigList({
      page: current,
      size,
      keyword: keyword.value || undefined
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t(`page.manage.setting.traceCapture.subTab.${categoryTabKey[props.category]}`),
        type: 'detail',
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'url',
        title: $t('page.manage.setting.traceCapture.col.url'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'trackType',
        title: $t('page.manage.setting.traceCapture.col.trackType'),
        visible: true,
        minWidth: 110,
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
        width: 160,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: `trace-config-${props.category}-v3`
});

const configVisible = ref(false);
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceConfigItem | null>(null);

const replaceVisible = ref(false);
const replaceRow = ref<Api.SystemManage.TraceConfigItem | null>(null);

function openReplace(row: Api.SystemManage.TraceConfigItem) {
  replaceRow.value = row;
  replaceVisible.value = true;
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  pagination.current = 1;
  getData();
}

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.SystemManage.TraceConfigItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

/** 单行删除（后端 delete 仅单 _id） */
async function handleDelete(row: Api.SystemManage.TraceConfigItem) {
  const { error } = await fetchDeleteTrackConfig(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
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
        :action-width="200"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #search-action>
          <div class="flex flex-wrap items-center gap-12px">
            <NInput
              v-model:value="keyword"
              class="w-200px!"
              clearable
              placeholder="请输入网络名称"
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
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </template>
        <template #operation-right>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
        </template>
        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
          <NButton size="small" type="primary" text @click="openReplace(row)">
            {{ $t('page.manage.setting.traceCapture.traceInfoTransform') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
        <template #trackType="{ row }">
          <span>{{ trackTypeLabel(row.trackType) }}</span>
        </template>
        <template #updateDate="{ row }">
          <span>{{ formatDateTime(row.updateDate) }}</span>
        </template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
    <TrackNetworkDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
    <TrackReplaceModal
      v-model:show="replaceVisible"
      :config-id="replaceRow?._id ?? ''"
      :network-name="replaceRow?.name ?? ''"
    />
  </div>
</template>
