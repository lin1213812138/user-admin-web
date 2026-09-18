<script setup lang="ts">
import { reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDeleteProblemGroup, fetchGetProblemGroupList } from '@/service/api/data-manage-archive';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import ProblemCategoryOperateDrawer from './ProblemCategoryOperateDrawer.vue';

type Row = Api.DataManage.BusinessProblemCategory;

const F = 'page.dataManage.business.problemCategory';

const searchItems: FormItemConfig[] = [
  {
    key: 'keyword',
    label: $t('common.keyword'),
    type: 'input',
    span: 12,
    placeholder: $t(`${F}.namePlaceholder`)
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 12 }
];

const searchParams = reactive<Record<string, unknown>>({
  keyword: ''
});

const buildColumns: () => VxeColumnConfig[] = () =>
  [
    { key: 'name', title: $t(`${F}.name`), type: 'detail', visible: true, minWidth: 140, sortable: false },
    { key: 'desc', title: $t(`${F}.desc`), visible: true, minWidth: 220, sortable: false },
    { key: 'note', title: $t(`${F}.note`), visible: true, minWidth: 260, sortable: false },
    {
      key: 'status',
      title: $t('common.status'),
      type: 'status',
      visible: true,
      width: 100,
      align: 'center',
      sortable: false
    },
    { key: 'createTime', title: $t('page.dataManage.common.createTime'), visible: true, width: 180, sortable: true }
  ] as VxeColumnConfig[];

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManage.ArchiveList<Row>,
  Row
>({
  api: async ({ current, size }) => {
    const params: Record<string, unknown> = { current, size };
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    }
    const { data: res, error } = await fetchGetProblemGroupList(
      params as unknown as Api.DataManage.ArchiveSearchParams
    );
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({
    records: (r.list ?? []).map(it => ({
      ...(it as object),
      createTime: (it as { createDate?: number }).createDate
        ? dayjs((it as { createDate: number }).createDate).format('YYYY-MM-DD HH:mm:ss')
        : (it as { createTime?: string }).createTime
    })) as unknown as Row[],
    total: r.total
  }),
  columns: buildColumns,
  cacheKey: 'data-manage-business-problem-category'
});

const configVisible = ref(false);
const checkedRows = ref<Row[]>([]);

function handleSelectionChange(records: Row[]) {
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
  handleSearch();
}

async function handleDelete(ids: string[]) {
  await fetchDeleteProblemGroup(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const drawerRef = ref<InstanceType<typeof ProblemCategoryOperateDrawer> | null>(null);

function handleAdd() {
  drawerRef.value?.openCreate();
}

function handleEdit(row: Row) {
  drawerRef.value?.openEdit(row);
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px">
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
            <NButton size="small" type="primary" ghost @click="handleAdd">
              <template #icon><icon-ic-round-plus class="text-icon" /></template>
              {{ $t('common.add') }}
            </NButton>
            <NPopconfirm
              :disabled="checkedRows.length === 0"
              @positive-click="handleDelete(checkedRows.map(i => (i as { _id: string })._id))"
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
          <NButton size="small" type="primary" text @click="handleEdit(row as Row)">
            {{ $t('common.edit') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete([(row as Row & { _id: string })._id])">
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

    <ProblemCategoryOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
