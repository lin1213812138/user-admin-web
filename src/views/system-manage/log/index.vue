<script setup lang="ts">
import { reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchGetOpLogList } from '@/service/api/op-log';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import OpLogDetailDrawer from './modules/op-log-detail-drawer.vue';

/** 操作端选项（0-TMS 1-PC 2-PDA 3-OMS） */
const clientOptions = [
  { label: 'TMS', value: 0 },
  { label: 'PC', value: 1 },
  { label: 'PDA', value: 2 },
  { label: 'OMS', value: 3 }
];

/** 操作类型选项（0-登录 1-修改 2-删除 3-退出） */
const opTypeOptions = [
  { label: $t('page.manage.opLog.opTypeOption.login'), value: 0 },
  { label: $t('page.manage.opLog.opTypeOption.update'), value: 1 },
  { label: $t('page.manage.opLog.opTypeOption.del'), value: 2 },
  { label: $t('page.manage.opLog.opTypeOption.logout'), value: 3 }
];

const searchParams = reactive<{
  dateRange: [number, number] | null;
  opType: Api.SystemManage.OpLogOpType | null;
  client: Api.SystemManage.OpLogClient | null;
  keyword: string;
}>({
  dateRange: null,
  opType: null,
  client: null,
  keyword: ''
});

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.OpLogList,
  Api.SystemManage.OpLog
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    // opType / client 非空才进 where（后端按数字精确等值匹配）
    const where: Api.SystemManage.OpLogSearchParams['where'] = {};
    if (searchParams.opType !== null) where.opType = searchParams.opType;
    if (searchParams.client !== null) where.client = searchParams.client;

    const { data: res, error } = await fetchGetOpLogList({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined,
      startDate: searchParams.dateRange?.[0],
      endDate: searchParams.dateRange?.[1],
      where: Object.keys(where).length ? where : undefined
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // wms-user 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.opLog.opName'),
        type: 'detail',
        visible: true,
        width: 180,
        sortable: false
      },
      { key: 'creator', title: $t('page.manage.opLog.creator'), visible: true, width: 100, sortable: false },
      {
        key: 'client',
        title: $t('page.manage.opLog.client'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      {
        key: 'opType',
        title: $t('page.manage.opLog.opType'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      { key: 'refNames', title: $t('page.manage.opLog.refNames'), visible: true, minWidth: 160, sortable: false },
      { key: 'ip', title: $t('page.manage.opLog.ip'), visible: true, width: 140, sortable: false },
      { key: 'desc', title: $t('page.manage.opLog.desc'), visible: true, minWidth: 220, sortable: false },
      {
        key: 'createDate',
        title: $t('page.manage.opLog.createDate'),
        visible: true,
        width: 170,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'system-manage-log'
});

/** 操作端文案 */
function clientText(value?: Api.SystemManage.OpLogClient) {
  return value === undefined ? '--' : (clientOptions[value]?.label ?? '--');
}

/** 操作类型文案 */
function opTypeText(value?: Api.SystemManage.OpLogOpType) {
  return value === undefined ? '--' : (opTypeOptions[value]?.label ?? '--');
}

/** 操作类型标签色（0-登录 1-修改 2-删除 3-退出；4-追踪为 OpLogOpType 扩展值，越界时兜底 default） */
function opTypeTagType(value?: Api.SystemManage.OpLogOpType) {
  const map = ['primary', 'info', 'error', 'default', 'warning'] as const;
  return value === undefined ? 'default' : (map[value] ?? 'default');
}

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const configVisible = ref(false);

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  searchParams.dateRange = null;
  searchParams.opType = null;
  searchParams.client = null;
  searchParams.keyword = '';
  handleSearch();
}

const detailVisible = ref(false);
const detailRow = ref<Api.SystemManage.OpLog | null>(null);

function handleDetail(row: Api.SystemManage.OpLog) {
  detailRow.value = row;
  detailVisible.value = true;
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-10px bg-#eff0f5">
    <div class="flex-1 min-h-0">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="80"
        @refresh="getData"
        @page-change="handlePageChange"
        @detail="handleDetail"
      >
        <!-- 快速搜索卡片：时间范围 + 操作类型 + 操作端 + 关键字（SearchBar 不透传自定义插槽，故整体走 search-action） -->
        <template #search-action>
          <div class="flex flex-wrap items-center gap-12px">
            <NDatePicker v-model:value="searchParams.dateRange" type="daterange" clearable class="w-360px!" />
            <NSelect
              v-model:value="searchParams.opType"
              :options="opTypeOptions"
              clearable
              :placeholder="$t('page.manage.opLog.form.opTypePlaceholder')"
              class="w-140px!"
            />
            <NSelect
              v-model:value="searchParams.client"
              :options="clientOptions"
              clearable
              :placeholder="$t('page.manage.opLog.form.clientPlaceholder')"
              class="w-140px!"
            />
            <NInput
              v-model:value="searchParams.keyword"
              clearable
              :placeholder="$t('page.manage.opLog.form.keywordPlaceholder')"
              class="w-240px!"
              @keyup.enter="handleSearch"
            />
            <LButton type="primary" ghost @click="handleSearch">
              <template #icon><icon-ic-round-search class="text-icon" /></template>
              {{ $t('common.search') }}
            </LButton>
            <LButton @click="handleReset">
              <template #icon><icon-ic-round-refresh class="text-icon" /></template>
              {{ $t('common.reset') }}
            </LButton>
          </div>
        </template>

        <template #client="{ row }">
          <NTag size="small">{{ clientText(row.client) }}</NTag>
        </template>

        <template #opType="{ row }">
          <NTag size="small" :type="opTypeTagType(row.opType)">
            {{ opTypeText(row.opType) }}
          </NTag>
        </template>

        <template #refNames="{ row }">
          <span>{{ row.refNames?.length ? row.refNames.join('、') : '--' }}</span>
        </template>

        <template #createDate="{ row }">
          <span>{{ formatDate(row.createDate) }}</span>
        </template>

        <!--
 <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </LButton>
          </NSpace>
        </template>
-->

        <template #action="{ row }">
          <LButton type="primary" text @click="handleDetail(row)">
            {{ $t('common.detail') }}
          </LButton>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <OpLogDetailDrawer v-model:show="detailVisible" :row="detailRow" />
  </div>
</template>

<style scoped></style>
