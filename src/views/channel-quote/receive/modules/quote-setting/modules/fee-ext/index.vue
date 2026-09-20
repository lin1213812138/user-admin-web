<script setup lang="ts">
/**
 * 报价设置 · 渠道加收面板
 *
 * 列表按当前渠道（refId）取数；新增走 `FeeExtOperateDrawer`（本轮只做新增，编辑/删除留后续迭代）。
 */
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteChannelFeeExt, fetchGetChannelFeeExtList } from '@/service/api/channel-fee-ext';
import FeeExtOperateDrawer from './FeeExtOperateDrawer.vue';

defineOptions({
  name: 'QuoteSettingFeeExtPanel'
});

const props = defineProps<{
  /** 当前渠道（报价设置页带入；后端按 refId 过滤该渠道的加收） */
  channelId: string;
}>();

/** 搜索条件：加收名称 */
const keyword = ref('');

/** 加收类型文案（对齐后端 strategy；未知值按「按重量」兜底） */
function strategyLabel(strategy?: Api.ChannelQuote.FeeExtStrategy) {
  if (strategy === 1) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byTicket');
  if (strategy === 2) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byItem');
  if (strategy === 3) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeightOver');

  return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeight');
}

const { data, loading, columns, pagination, getData } = useVxeTable<
  Api.ChannelQuote.ChannelFeeExtList,
  Api.ChannelQuote.ChannelFeeExt
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetChannelFeeExtList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: { refId: props.channelId }
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.channelQuote.quoteSetting.feeExt.name'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'country',
        title: $t('page.channelQuote.quoteSetting.feeExt.country'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'strategy',
        title: $t('page.channelQuote.quoteSetting.feeExt.type'),
        visible: true,
        minWidth: 130,
        sortable: false
      },
      {
        key: 'expr',
        title: $t('page.channelQuote.quoteSetting.feeExt.condition'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'price',
        title: $t('page.channelQuote.quoteSetting.feeExt.fee'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: false
      },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 140, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[]
});

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  handleSearch();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

/** 删除单条加收（后端仅支持单条 _id，无批量路由） */
async function handleDelete(row: Api.ChannelQuote.ChannelFeeExt) {
  const { error } = await fetchDeleteChannelFeeExt(row._id);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  getData();
}

const drawerRef = ref<InstanceType<typeof FeeExtOperateDrawer> | null>(null);
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      show-seq
      show-action
      :action-width="140"
      :search-action-flush="false"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <!-- 快速搜索栏（表格组件自带 search-action 卡片）：加收名称检索 -->
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="keyword"
            class="w-240px!"
            clearable
            :placeholder="$t('page.channelQuote.quoteSetting.search.feeExtPlaceholder')"
            @keyup.enter="handleSearch"
          />
          <LButton type="primary" @click="handleSearch">
            <template #icon>
              <icon-ic-round-search class="text-icon" />
            </template>
            {{ $t('common.search') }}
          </LButton>
          <LButton @click="handleReset">{{ $t('common.reset') }}</LButton>
        </div>
      </template>

      <template #operation-left>
        <LButton type="primary" @click="drawerRef?.open()">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          {{ $t('page.channelQuote.quoteSetting.actions.addFeeExt') }}
        </LButton>
      </template>

      <template #operation-right>
        <LButton circle :tooltip="$t('common.refresh')" @click="getData">
          <template #icon><icon-mdi-refresh class="text-icon" /></template>
        </LButton>
      </template>

      <template #country="{ row }">
        <span>{{ row.country || '--' }}</span>
      </template>
      <template #strategy="{ row }">
        <span>{{ strategyLabel(row.strategy) }}</span>
      </template>
      <template #expr="{ row }">
        <span>{{ row.expr || '--' }}</span>
      </template>
      <template #price="{ row }">
        <span>{{ row.price ?? '--' }}</span>
      </template>
      <template #note="{ row }">
        <span>{{ row.note || '--' }}</span>
      </template>

      <template #action="{ row }">
        <LButton type="primary" text @click="drawerRef?.openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton type="error" text popconfirm @positive-click="handleDelete(row)">{{ $t('common.delete') }}</LButton>
      </template>
    </Table>
    <FeeExtOperateDrawer ref="drawerRef" :channel-id="channelId" @submitted="getData" />
  </div>
</template>

<style scoped></style>
