<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { useRouterPush } from '@/hooks/common/router';
import { fetchDeleteChannel, fetchGetChannelList, fetchUpdateChannel } from '@/service/api/channel';
import { sessionStg } from '@/utils/storage';
import ChannelOperateDrawer from './modules/channel-operate-drawer.vue';
import BindOrderTemplateModal from './modules/bind-order-template-modal.vue';

const statusOptions: SelectOption[] = [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
];

// 搜索条件：空值统一 null，不写空字符串
const searchParams = reactive<Record<string, unknown>>({
  keyword: null,
  status: null
});

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.ChannelQuote.ReceiveChannelList,
  Api.ChannelQuote.ReceiveChannel
>({
  api: async ({ current, size }) => {
    const params: Api.ChannelQuote.ReceiveChannelSearchParams = { page: current, size };
    if (searchParams.keyword) params.keyword = searchParams.keyword as string;
    if (searchParams.status !== null && searchParams.status !== undefined) {
      params.status = searchParams.status as number;
    }
    const { data: res, error } = await fetchGetChannelList(params);
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      { key: 'code', title: $t('page.channelQuote.receive.code'), visible: true, sortable: false },
      { key: 'name', title: $t('page.channelQuote.receive.name'), visible: true, sortable: false },
      {
        key: 'carrier',
        title: $t('page.channelQuote.receive.form.carrier'),
        visible: true,
        sortable: false
      },
      {
        key: 'channelGroup',
        title: $t('page.channelQuote.receive.form.channelGroup'),
        visible: true,
        sortable: false
      },
      { key: 'site', title: $t('page.channelQuote.receive.form.site'), visible: true, sortable: false },
      {
        key: 'weightRuleName',
        title: $t('page.channelQuote.receive.form.weightRule'),
        visible: true,
        sortable: false
      },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.channelQuote.common.createTime'),
        visible: true,
        width: 180,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'channel-quote-receive-v2'
});

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('common.keyword'),
    type: 'input',
    span: 8,
    placeholder: $t('page.channelQuote.common.keywordPlaceholder')
  },
  { key: 'status', label: $t('common.status'), type: 'select', span: 8, options: statusOptions },
  { key: 'actions', label: ' ', slot: 'actions', span: 8 }
]);

const configVisible = ref(false);
const checkedRows = ref<Api.ChannelQuote.ReceiveChannel[]>([]);

function handleSelectionChange(records: Api.ChannelQuote.ReceiveChannel[]) {
  checkedRows.value = records;
}

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
  searchParams.keyword = null;
  searchParams.status = null;
  handleSearch();
}

/** 后端 /channel/delete 仅支持单条 _id，批量删除前端逐条调用 */
async function handleDelete(ids: string[]) {
  for (const id of ids) {
    const { error } = await fetchDeleteChannel(id);
    if (error) return;
  }
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const drawerRef = ref<InstanceType<typeof ChannelOperateDrawer> | null>(null);

/** 列表启用 / 停用：/channel/update 走 uniqField:['name','code']，必须随行回传 name + code */
async function handleToggleStatus(row: Api.ChannelQuote.ReceiveChannel) {
  const next: Api.Common.EnableStatus = row.status === 1 ? 0 : 1;

  const { error } = await fetchUpdateChannel({
    _id: row._id,
    name: row.name,
    code: row.code,
    status: next
  });
  if (error) return;

  row.status = next;
  window.$message?.success(next === 1 ? $t('common.enable') : $t('common.disable'));
}

const bindModalRef = ref<InstanceType<typeof BindOrderTemplateModal> | null>(null);
function handleBindTemplate(row: Api.ChannelQuote.ReceiveChannel) {
  bindModalRef.value?.open(row);
}

const { routerPushByKey } = useRouterPush();

/**
 * 跳转报价设置页（渠道内嵌子页：不进菜单，侧栏「收货渠道」保持高亮）。
 * 渠道上下文经 sessionStorage 传递、不落 URL——避免渠道 id / 名称明文出现在地址栏、浏览器历史与分享链接中。
 */
function handleQuoteSetting(row: Api.ChannelQuote.ReceiveChannel) {
  sessionStg.set('quoteSettingContext', { channelId: row._id, channelName: row.name });
  void routerPushByKey('channel-quote_receive_quote-setting');
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px py-8px pl-10px">
    <div class="flex-1 min-h-0">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="300"
        :search-items="searchItems"
        :search-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton type="primary" ghost @click="drawerRef?.openCreate()">
              <template #icon><icon-ic-round-plus class="text-icon" /></template>
              {{ $t('common.add') }}
            </LButton>
            <LButton
              type="error"
              ghost
              :disabled="checkedRows.length === 0"
              popconfirm
              @positive-click="handleDelete(checkedRows.map(i => i._id))"
            >
              <template #icon><icon-mdi-delete class="text-icon" /></template>
              {{ $t('common.batchDelete') }}
            </LButton>
          </NSpace>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton circle :tooltip="$t('common.columnSetting')" @click="configVisible = true">
              <template #icon><icon-mdi-cog class="text-icon" /></template>
            </LButton>
            <LButton circle :tooltip="$t('common.refresh')" @click="getData">
              <template #icon><icon-mdi-refresh class="text-icon" /></template>
            </LButton>
          </NSpace>
        </template>

        <template #carrier="{ row }">
          <span>{{ row.carrier || '--' }}</span>
        </template>
        <template #channelGroup="{ row }">
          <span>{{ row.channelGroup || '--' }}</span>
        </template>
        <template #site="{ row }">
          <span>{{ row.site || '--' }}</span>
        </template>
        <template #weightRuleName="{ row }">
          <span>{{ row.weightRuleName || '--' }}</span>
        </template>
        <template #createDate="{ row }">
          <span>{{ formatDateTime(row.createDate) }}</span>
        </template>

        <template #action="{ row }">
          <LButton type="primary" text @click="drawerRef?.openEdit(row)">
            {{ $t('common.edit') }}
          </LButton>
          <LButton type="primary" text @click="handleQuoteSetting(row)">
            {{ $t('page.channelQuote.quoteSetting.title') }}
          </LButton>
          <LButton
            :type="row.status === 1 ? 'warning' : 'success'"
            text
            :popconfirm="row.status === 1 ? $t('common.confirmDisable') : $t('common.confirmEnable')"
            @positive-click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
          </LButton>
          <LButton type="primary" text @click="handleBindTemplate(row)">
            {{ $t('page.channelQuote.receive.bindOrderTemplate') }}
          </LButton>
          <!--
 <LButton type="error" text popconfirm @positive-click="handleDelete([row._id])">
            {{ $t('common.delete') }}
          </LButton>
-->
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ChannelOperateDrawer ref="drawerRef" @submitted="getData" />

    <BindOrderTemplateModal ref="bindModalRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
