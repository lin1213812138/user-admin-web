<script setup lang="ts">
import { reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDeleteProductGroup, fetchGetProductGroupList } from '@/service/api/data-manage-archive';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import GoodsCategoryOperateDrawer from './GoodsCategoryOperateDrawer.vue';

type Row = Api.DataManage.BusinessGoodsCategory;

const F = 'page.dataManage.business.goodsCategory';
const yesNo = (v: unknown) => $t(v ? 'common.yesOrNo.yes' : 'common.yesOrNo.no');

const searchParams = reactive<Record<string, unknown>>({
  keyword: ''
});

const buildColumns: () => VxeColumnConfig[] = () =>
  [
    { key: 'name', title: $t(`${F}.name`), type: 'detail', visible: true, minWidth: 140, sortable: false },
    { key: 'note', title: $t(`${F}.note`), visible: true, minWidth: 220, sortable: false },
    { key: 'sensitive', title: $t(`${F}.sensitive`), visible: true, width: 120, sortable: false },
    { key: 'charged', title: $t(`${F}.charged`), visible: true, width: 100, sortable: false },
    { key: 'danger', title: $t(`${F}.danger`), visible: true, width: 120, sortable: false },
    { key: 'isDefault', title: $t(`${F}.isDefault`), visible: true, width: 100, sortable: false },
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
    const { data: res, error } = await fetchGetProductGroupList(
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
  cacheKey: 'data-manage-business-goods-category'
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
  await fetchDeleteProductGroup(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const drawerRef = ref<InstanceType<typeof GoodsCategoryOperateDrawer> | null>(null);

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
        :action-width="100"
        :search-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton type="primary" ghost @click="handleAdd">
              <template #icon><icon-ic-round-plus class="text-icon" /></template>
              {{ $t('common.add') }}
            </LButton>
            <LButton
              type="error"
              ghost
              :disabled="checkedRows.length === 0"
              popconfirm
              @positive-click="handleDelete(checkedRows.map(i => (i as { _id: string })._id))"
            >
              <template #icon><icon-mdi-delete class="text-icon" /></template>
              {{ $t('common.batchDelete') }}
            </LButton>
          </NSpace>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton circle @click="configVisible = true">
              <template #icon><icon-mdi-cog class="text-icon" /></template>
            </LButton>
            <LButton circle @click="getData">
              <template #icon><icon-mdi-refresh class="text-icon" /></template>
            </LButton>
          </NSpace>
        </template>

        <template #action="{ row }">
          <LButton type="primary" text @click="handleEdit(row as Row)">
            {{ $t('common.edit') }}
          </LButton>
          <LButton type="error" text popconfirm @positive-click="handleDelete([(row as Row & { _id: string })._id])">
            {{ $t('common.delete') }}
          </LButton>
        </template>

        <template #sensitive="{ row }">{{ yesNo((row as Row).sensitive) }}</template>
        <template #charged="{ row }">{{ yesNo((row as Row).charged) }}</template>
        <template #danger="{ row }">{{ yesNo((row as Row).danger) }}</template>
        <template #isDefault="{ row }">{{ yesNo((row as Row).isDefault) }}</template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <GoodsCategoryOperateDrawer ref="drawerRef" @submitted="getData" />
  </div>
</template>
