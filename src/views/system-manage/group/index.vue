<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteGroup, fetchGetGroupList, fetchGetSiteList } from '@/service/api/system-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import GroupOperateDrawer from './modules/group-operate-drawer.vue';

const searchParams = reactive<Omit<Api.SystemManage.GroupSearchParams, 'current' | 'size'>>({
  groupName: '',
  siteId: null,
  status: null
});

/** 所属站点下拉选项（来自站点管理真实接口，站点主键为字符串 _id） */
const siteOptions = ref<CommonType.Option<string>[]>([]);

async function loadSiteOptions() {
  const { data } = await fetchGetSiteList({ page: 1, size: 100 });
  siteOptions.value = (data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadSiteOptions();
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'groupName',
    label: $t('page.manage.group.groupName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.group.form.groupNamePlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.group.siteName'),
    type: 'select',
    span: 6,
    options: siteOptions.value,
    placeholder: $t('page.manage.group.form.siteNamePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.group.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.group.form.statusPlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.GroupList,
  Api.SystemManage.Group
>({
  api: ({ current, size }) =>
    fetchGetGroupList({
      current,
      size,
      groupName: searchParams.groupName?.trim() || undefined,
      // 站点 id / 状态 0 都是有效值，须用 ?? 兜底而不是 ||
      siteId: searchParams.siteId ?? undefined,
      status: searchParams.status ?? undefined
    }) as Promise<Api.SystemManage.GroupList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'groupName',
        title: $t('page.manage.group.groupName'),
        type: 'detail',
        visible: true,
        width: 140,
        sortable: false
      },
      { key: 'remark', title: $t('page.manage.group.remark'), visible: true, minWidth: 160, sortable: false },
      { key: 'siteName', title: $t('page.manage.group.siteName'), visible: true, width: 120, sortable: false },
      { key: 'createTime', title: $t('page.manage.group.createTime'), visible: true, width: 180, sortable: true },
      { key: 'updateTime', title: $t('page.manage.group.updateTime'), visible: true, width: 180, sortable: true },
      {
        key: 'status',
        title: $t('page.manage.group.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      }
    ] as VxeColumnConfig[],
  cacheKey: 'system-manage-group'
});

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Group[]>([]);

function handleSelectionChange(records: Api.SystemManage.Group[]) {
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
  searchParams.groupName = '';
  searchParams.siteId = null;
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteGroup(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Group | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Group) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.Group) {
  openDrawer('detail', row);
}

function handleEdit(row: Api.SystemManage.Group) {
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
        <template #createTime="{ row }">
          <span>{{ row.createByName }} - {{ row.createTime }}</span>
        </template>

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

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <GroupOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
