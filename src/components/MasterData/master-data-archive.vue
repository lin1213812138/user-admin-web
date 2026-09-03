<script setup lang="ts" generic="T extends MasterDataRow">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import {
  fetchCreateDataManage,
  fetchDeleteDataManage,
  fetchGetDataManageList,
  fetchUpdateDataManage
} from '@/service/api/data-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import NFormWrap from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';
import type { ArchiveConfig, MasterDataRow } from './types';

const props = defineProps<{ config: ArchiveConfig<T> }>();

const searchParams = reactive<Record<string, unknown>>({});
for (const it of props.config.searchItems) {
  searchParams[it.key] = it.type === 'select' ? null : '';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.DataManage.ArchiveList<T>,
  T
>({
  api: ({ current, size }) => {
    const params: Record<string, unknown> = { current, size };
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    }
    return fetchGetDataManageList<T>(props.config.archive, params as unknown as Api.DataManage.ArchiveSearchParams);
  },
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      ...props.config.columns(),
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
        key: 'createTime',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 180,
        sortable: true
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: props.config.cacheKey
});

const configVisible = ref(false);
const checkedRows = ref<T[]>([]);

function handleSelectionChange(records: T[]) {
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
  for (const it of props.config.searchItems) {
    searchParams[it.key] = it.type === 'select' ? null : '';
  }
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteDataManage(props.config.archive, ids);
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
  const base = $t(props.config.titleI18nKey as App.I18n.I18nKey);
  const op =
    drawerMode.value === 'create'
      ? $t('common.add')
      : drawerMode.value === 'edit'
        ? $t('common.edit')
        : $t('common.detail');
  return `${op}${base}`;
});

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: T) {
  drawerMode.value = mode;
  const source = (mode === 'create' ? props.config.createDefault() : (row ?? {})) as Record<string, unknown>;
  for (const it of props.config.formItems) {
    model[it.key] = source[it.key];
  }
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
      await fetchCreateDataManage<T>(props.config.archive, model as Partial<T>);
      window.$message?.success($t('common.createSuccess'));
    } else {
      await fetchUpdateDataManage<T>(props.config.archive, model as T);
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
        :search-items="config.searchItems"
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
          <NButton size="small" type="primary" text @click="openDrawer('edit', row as T)">
            {{ $t('common.edit') }}
          </NButton>
          <NButton size="small" type="info" text @click="openDrawer('detail', row as T)">
            {{ $t('common.detail') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete([(row as T).id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />

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
        :items="config.formItems"
        :disabled="drawerMode === 'detail'"
        :grid-x-gap="16"
        label-placement="top"
      />
    </Drawer>
  </div>
</template>

<style scoped></style>
