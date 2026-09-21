<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteRemoteGroup, fetchGetRemoteGroupList } from '@/service/api/remote-group';
import { fetchGetRemoteList } from '@/service/api/remote';
import RemoteSearchForm from './RemoteSearchForm.vue';
import RemoteGroupOperateDrawer from './RemoteGroupOperateDrawer.vue';
import RemoteImportDrawer from './RemoteImportDrawer.vue';

defineOptions({ name: 'DataManageBasicRemote' });

type BasicRemoteGroup = Api.DataManage.BasicRemoteGroup;

/** 搜索条件：目的地（国家）/ 城市 / 邮编 / 偏远类别 */
const countryId = ref('');
const city = ref('');
const zip = ref('');
const remoteGroupId = ref('');

/** 地区反查的分页参数：单次 1000 条、最多 20 页，避免超大类别被一次性全量拉取 */
const REGION_PAGE_SIZE = 1000;
const REGION_MAX_PAGE = 20;

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

/**
 * 组织类别列表的过滤条件：
 * - 只选了「偏远类别」→ 直接按 _id 过滤；
 * - 填了「目的地 / 城市 / 邮编」→ 先查 /remote/query 拿到命中的 remoteGroupId 集合，再按 _id 过滤；
 *   命中为空时返回 null（直接渲染空列表，避免空数组被后端 formatWhere 转成 `_id: undefined` 而失去过滤）。
 */
async function buildWhere(): Promise<Record<string, unknown> | null> {
  const hasRegion = Boolean(countryId.value || city.value || zip.value);

  if (!hasRegion) return remoteGroupId.value ? { _id: [remoteGroupId.value] } : {};

  const ids = new Set<string>();

  for (let page = 1; page <= REGION_MAX_PAGE; page += 1) {
    const { data, error } = await fetchGetRemoteList({
      page,
      size: REGION_PAGE_SIZE,
      countryId: countryId.value || undefined,
      city: city.value || undefined,
      zip: zip.value || undefined,
      remoteGroupId: remoteGroupId.value || undefined
    });

    if (error || !data) break;

    data.list.forEach(item => {
      if (item.remoteGroupId) ids.add(item.remoteGroupId);
    });

    if (data.list.length < REGION_PAGE_SIZE) break;
  }

  return ids.size ? { _id: [...ids] } : null;
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  { list: BasicRemoteGroup[]; total: number },
  BasicRemoteGroup
>({
  api: async ({ current, size }) => {
    const where = await buildWhere();
    if (!where) return { list: [], total: 0 };

    const { data: res, error } = await fetchGetRemoteGroupList({ page: current, size, where });
    if (error || !res) return { list: [], total: 0 };

    return { list: res.list, total: res.total };
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.basic.remote.name'),
        type: 'detail',
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'remoteCount',
        title: $t('page.dataManage.basic.remote.remoteCount'),
        visible: true,
        width: 140,
        align: 'center',
        sortable: false
      },
      {
        key: 'updateBy',
        title: $t('page.dataManage.basic.remote.updateBy'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.dataManage.basic.remote.updateDate'),
        visible: true,
        width: 180,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 180,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-basic-remote'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}
function handleReset() {
  countryId.value = '';
  city.value = '';
  zip.value = '';
  remoteGroupId.value = '';
  pagination.current = 1;
  getData();
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

const checkedRows = ref<BasicRemoteGroup[]>([]);
function handleSelectionChange(rows: BasicRemoteGroup[]) {
  checkedRows.value = rows;
}
async function confirmDelete(row: BasicRemoteGroup) {
  const { error } = await fetchDeleteRemoteGroup([row._id]);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}
async function confirmBatchDelete() {
  const { error } = await fetchDeleteRemoteGroup(checkedRows.value.map(item => item._id));
  if (error) return;
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const createDrawerRef = ref<InstanceType<typeof RemoteGroupOperateDrawer> | null>(null);
const importDrawerRef = ref<InstanceType<typeof RemoteImportDrawer> | null>(null);
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
      :action-width="120"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <RemoteSearchForm
          v-model:country-id="countryId"
          v-model:city="city"
          v-model:zip="zip"
          v-model:remote-group-id="remoteGroupId"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>
      <template #remoteCount="{ row }">
        <span>{{ (row as BasicRemoteGroup).remoteCount ?? 0 }}</span>
      </template>
      <template #updateDate="{ row }">
        <span>{{ formatDateTime((row as BasicRemoteGroup).updateDate) }}</span>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime((row as BasicRemoteGroup).createDate) }}</span>
      </template>
      <template #operation-left>
        <LButton type="primary" ghost @click="createDrawerRef?.open()">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('page.dataManage.basic.remote.addGroup') }}
        </LButton>
        <LButton
          type="error"
          ghost
          :disabled="checkedRows.length === 0"
          popconfirm
          @positive-click="confirmBatchDelete"
        >
          <template #icon><icon-mdi-delete class="text-icon" /></template>
          {{ $t('common.batchDelete') }}
        </LButton>
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle :tooltip="$t('common.refresh')" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <LButton type="primary" text @click="importDrawerRef?.open(row as BasicRemoteGroup)">
          {{ $t('page.dataManage.basic.remote.import') }}
        </LButton>
        <LButton type="error" text popconfirm @positive-click="confirmDelete(row as BasicRemoteGroup)">
          {{ $t('common.delete') }}
        </LButton>
      </template>
    </Table>

    <RemoteGroupOperateDrawer ref="createDrawerRef" @submitted="getData" />
    <RemoteImportDrawer ref="importDrawerRef" @submitted="getData" />
  </div>
</template>
