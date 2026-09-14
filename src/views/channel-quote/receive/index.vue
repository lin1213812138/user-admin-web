<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';
import {
  fetchCreateChannelQuote,
  fetchDeleteChannelQuote,
  fetchGetChannelQuoteList,
  fetchUpdateChannelQuote
} from '@/service/api/channel-quote';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';

const ARCHIVE = 'receive' as const;

const statusOptions: SelectOption[] = [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
];

const searchParams = reactive<Record<string, unknown>>({
  keyword: '',
  status: null
});

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.ChannelQuote.ChannelQuoteList<Api.ChannelQuote.ReceiveChannel>,
  Api.ChannelQuote.ReceiveChannel
>({
  api: ({ current, size }) => {
    const params: Record<string, unknown> = { current, size };
    if (searchParams.keyword) params.keyword = searchParams.keyword;
    if (searchParams.status !== null && searchParams.status !== undefined) params.status = searchParams.status;
    return fetchGetChannelQuoteList<Api.ChannelQuote.ReceiveChannel>(
      ARCHIVE,
      params as unknown as Api.ChannelQuote.ChannelQuoteSearchParams
    );
  },
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'code', title: $t('page.channelQuote.receive.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.channelQuote.receive.name'), visible: true, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      { key: 'remark', title: $t('common.remark'), visible: true, sortable: false },
      { key: 'createTime', title: $t('page.channelQuote.common.createTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'channel-quote-receive'
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

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.channelQuote.receive.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.channelQuote.receive.form.codePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.channelQuote.receive.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.channelQuote.receive.form.namePlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
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
  searchParams.keyword = '';
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteChannelQuote(ARCHIVE, ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit' | 'detail'>('create');
const submitting = ref(false);
const model = reactive<Record<string, unknown>>({});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() => {
  const base = $t('page.channelQuote.receive.title');
  const op =
    drawerMode.value === 'create'
      ? $t('common.add')
      : drawerMode.value === 'edit'
        ? $t('common.edit')
        : $t('common.detail');
  return `${op}${base}`;
});

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.ChannelQuote.ReceiveChannel) {
  drawerMode.value = mode;
  const source = (mode === 'create' ? { code: '', name: '', status: 1, remark: '' } : (row ?? {})) as Record<
    string,
    unknown
  >;
  model.code = source.code;
  model.name = source.name;
  model.status = source.status;
  model.remark = source.remark;
  model.id = row?.id;
  drawerVisible.value = true;
}

async function handleSubmit() {
  if (drawerMode.value === 'detail') {
    drawerVisible.value = false;
    return;
  }
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      await fetchCreateChannelQuote<Api.ChannelQuote.ReceiveChannel>(
        ARCHIVE,
        model as unknown as Partial<Api.ChannelQuote.ReceiveChannel>
      );
      window.$message?.success($t('common.createSuccess'));
    } else {
      await fetchUpdateChannelQuote<Api.ChannelQuote.ReceiveChannel>(
        ARCHIVE,
        model as unknown as Api.ChannelQuote.ReceiveChannel
      );
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    getData();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px py-8px pl-16px">
    <div class="flex-1 min-h-0">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="180"
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
            <NButton size="small" type="primary" ghost @click="openDrawer('create')">
              <template #icon><icon-ic-round-plus class="text-icon" /></template>
              {{ $t('common.add') }}
            </NButton>
            <NPopconfirm
              :disabled="checkedRows.length === 0"
              @positive-click="handleDelete(checkedRows.map(i => i.id))"
            >
              <template #trigger>
                <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
                  <template #icon><icon-mdi-delete class="text-icon" /></template>
                  {{ $t('common.batchDelete') }}
                </NButton>
              </template>
              {{ $t('common.confirmDelete') }}
            </NPopconfirm>
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
          <NButton size="small" type="primary" text @click="openDrawer('edit', row)">
            {{ $t('common.edit') }}
          </NButton>
          <NButton size="small" type="info" text @click="openDrawer('detail', row)">
            {{ $t('common.detail') }}
          </NButton>
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

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :footer="drawerMode !== 'detail'"
      width="520"
      @submit="handleSubmit"
    >
      <NFormWrap
        ref="formRef"
        :model="model"
        :items="formItems"
        :disabled="drawerMode === 'detail'"
        :grid-x-gap="16"
        label-placement="top"
      />
    </Drawer>
  </div>
</template>

<style scoped></style>
