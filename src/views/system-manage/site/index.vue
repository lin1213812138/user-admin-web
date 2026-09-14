<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteSite, fetchGetSiteList } from '@/service/api/system-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import SiteOperateDrawer from './modules/site-operate-drawer.vue';

const searchParams = reactive<Omit<Api.SystemManage.SiteSearchParams, 'current' | 'size'>>({
  siteCode: '',
  siteName: '',
  status: null
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'siteCode',
    label: $t('page.manage.site.siteCode'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.site.form.siteCodePlaceholder')
  },
  {
    key: 'siteName',
    label: $t('page.manage.site.siteName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.site.form.siteNamePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.site.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.site.form.statusPlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.SystemManage.SiteList,
  Api.SystemManage.Site
>({
  api: ({ current, size }) =>
    fetchGetSiteList({
      current,
      size,
      siteCode: searchParams.siteCode?.trim() || undefined,
      siteName: searchParams.siteName?.trim() || undefined,
      // 状态 0（禁用）是有效筛选值，须用 ?? 兜底而不是 ||
      status: searchParams.status ?? undefined
    }) as Promise<Api.SystemManage.SiteList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'siteCode',
        title: $t('page.manage.site.siteCode'),
        type: 'detail',
        visible: true,
        width: 120,
        sortable: false
      },
      { key: 'siteName', title: $t('page.manage.site.siteName'), visible: true, width: 120, sortable: false },
      { key: 'contactName', title: $t('page.manage.site.contactName'), visible: true, width: 100, sortable: false },
      { key: 'contactPhone', title: $t('page.manage.site.contactPhone'), visible: true, width: 140, sortable: false },
      { key: 'workTime', title: $t('page.manage.site.workTime'), visible: true, minWidth: 180, sortable: false },
      { key: 'defaultOrigin', title: $t('page.manage.site.defaultOrigin'), visible: true, width: 120, sortable: false },
      {
        key: 'warehouseAddress',
        title: $t('page.manage.site.warehouseAddress'),
        visible: true,
        minWidth: 240,
        sortable: false
      },
      { key: 'remark', title: $t('page.manage.site.remark'), visible: false, minWidth: 160, sortable: false },
      { key: 'updateTime', title: $t('page.manage.site.updateTime'), visible: true, width: 180, sortable: true },
      {
        key: 'status',
        title: $t('page.manage.site.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-site'
});

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Site[]>([]);

function handleSelectionChange(records: Api.SystemManage.Site[]) {
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
  searchParams.siteCode = '';
  searchParams.siteName = '';
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteSite(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Site | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Site) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.Site) {
  openDrawer('detail', row);
}

function handleEdit(row: Api.SystemManage.Site) {
  openDrawer('edit', row);
}

function handleSubmitted() {
  getData();
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-16px">
    <div class="flex-1 min-h-0">
      <Table
        :search-items="searchItems"
        :search-model="searchParams"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="120"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
        <template #updateTime="{ row }">
          <span>{{ row.updateByName }} - {{ row.updateTime }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" ghost @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
            <NPopconfirm
              :disabled="checkedRows.length === 0"
              @positive-click="handleDelete(checkedRows.map(i => i.id))"
            >
              <template #trigger>
                <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
                  <template #icon>
                    <icon-mdi-delete class="text-icon" />
                  </template>
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

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="handleEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />

    <SiteOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
