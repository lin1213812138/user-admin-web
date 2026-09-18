<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDeleteProducts, fetchGetProductList } from '@/service/api/declared-goods';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { TableExportAction } from '@/components/Export';
import ProductOperateDrawer from './ProductOperateDrawer.vue';

type Row = Api.DeclaredGoods.Product;

const F = 'page.dataManage.business.declaredGoods.fields';

/** 搜索字段选择器（对齐老系统：字段下拉 + 关键词） */
const fieldOptions = [
  { label: $t(`${F}.nameCn`), value: 'nameCn' },
  { label: $t(`${F}.nameEn`), value: 'nameEn' },
  { label: $t(`${F}.hsCode`), value: 'hsCode' },
  { label: $t(`${F}.sku`), value: 'sku' }
];

const searchParams = reactive<{ field: string; keyword: string }>({
  field: 'nameCn',
  keyword: ''
});

function buildQueryParams(page: number, size: number) {
  return {
    page,
    size,
    keyword: searchParams.keyword?.trim() || undefined,
    keywordFields: [searchParams.field]
  };
}

const { data, loading, columns, pagination, getData, resetColumns, persistColumns, columnConfigs } = useVxeTable<
  Api.DeclaredGoods.QueryResult<Row>,
  Row
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetProductList(buildQueryParams(current, size));
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      { key: 'nameCn', title: $t(`${F}.nameCn`), type: 'detail', visible: true, minWidth: 140, sortable: false },
      { key: 'nameEn', title: $t(`${F}.nameEn`), visible: true, minWidth: 140, sortable: false },
      { key: 'hsCode', title: $t(`${F}.hsCode`), visible: true, width: 110, sortable: false },
      { key: 'price', title: $t(`${F}.price`), visible: true, width: 90, align: 'right', sortable: false },
      { key: 'currency', title: $t(`${F}.currency`), visible: true, width: 80, sortable: false },
      { key: 'weight', title: $t(`${F}.weight`), visible: true, width: 80, align: 'right', sortable: false },
      { key: 'unit', title: $t(`${F}.unit`), visible: true, width: 70, sortable: false },
      { key: 'producer', title: $t(`${F}.producer`), visible: true, width: 90, sortable: false },
      { key: 'brand', title: $t(`${F}.brand`), visible: true, width: 100, sortable: false },
      { key: 'material', title: $t(`${F}.material`), visible: true, width: 100, sortable: false },
      { key: 'use', title: $t(`${F}.use`), visible: true, width: 110, sortable: false },
      { key: 'model', title: $t(`${F}.model`), visible: true, width: 100, sortable: false },
      { key: 'standard', title: $t(`${F}.standard`), visible: true, width: 100, sortable: false },
      { key: 'feeCustom', title: $t(`${F}.feeCustom`), visible: true, width: 80, align: 'right', sortable: false },
      { key: 'taxRate', title: $t(`${F}.taxRate`), visible: true, width: 80, align: 'right', sortable: false },
      { key: 'sku', title: $t(`${F}.sku`), visible: true, width: 120, sortable: false },
      { key: 'sellUrl', title: $t(`${F}.sellUrl`), visible: true, minWidth: 160, sortable: false },
      { key: 'imgUrl', title: $t(`${F}.imgUrl`), visible: true, width: 80, align: 'center', sortable: false },
      { key: 'updateDate', title: $t(`${F}.updateDate`), visible: true, width: 170, align: 'center', sortable: false }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-business-declared-goods-product'
});

onMounted(() => {
  // 无额外初始化；useCountrySelect 在抽屉内自行加载
});

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
  searchParams.field = 'nameCn';
  searchParams.keyword = '';
  handleSearch();
}

/** 全量导出（TableExportAction fetch-all） */
async function fetchAllProducts(): Promise<Row[]> {
  const { data: res, error } = await fetchGetProductList(buildQueryParams(1, 100000));
  if (error || !res) return [];
  return res.list;
}

const checkedRows = ref<Row[]>([]);
function handleSelectionChange(rows: Row[]) {
  checkedRows.value = rows;
}

const configVisible = ref(false);
const operateRef = ref<InstanceType<typeof ProductOperateDrawer>>();

function openCreate() {
  operateRef.value?.openCreate();
}

function openEdit(row: Row) {
  operateRef.value?.openEdit(row);
}

async function handleDelete(row: Row) {
  if (!row._id) return;
  const { error } = await fetchDeleteProducts([row._id]);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  getData();
}

async function handleBatchDelete() {
  const ids = checkedRows.value.map(row => row._id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;

  const { error } = await fetchDeleteProducts(ids);
  if (error) return;

  checkedRows.value = [];
  window.$message?.success($t('common.deleteSuccess'));
  getData();
}
</script>

<template>
  <div class="h-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-checkbox="true"
      :show-action="true"
      :action-width="110"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NSelect
            v-model:value="searchParams.field"
            class="w-140px"
            :options="fieldOptions"
            :consistent-menu-width="false"
          />
          <NInput
            v-model:value="searchParams.keyword"
            class="w-240px!"
            :placeholder="$t('common.keyword')"
            @keyup.enter="handleSearch"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
      </template>

      <template #operation-left>
        <NSpace justify="start" wrap>
          <NButton type="primary" ghost @click="openCreate">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            {{ $t('common.add') }}
          </NButton>
          <NPopconfirm :disabled="checkedRows.length === 0" @positive-click="handleBatchDelete">
            <template #trigger>
              <NButton type="error" ghost :disabled="checkedRows.length === 0">
                <template #icon><icon-mdi-delete class="text-icon" /></template>
                {{ $t('common.batchDelete') }}
              </NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
          <TableExportAction
            :columns="columnConfigs"
            :data="data"
            :checked-data="checkedRows"
            :fetch-all="fetchAllProducts"
            :filename="$t('page.dataManage.business.declaredGoods.library')"
          />
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

      <template #imgUrl="{ row }">
        <NImage
          v-if="(row as Row).imgUrl"
          :src="(row as Row).imgUrl"
          class="h-32px w-32px rounded-4px"
          object-fit="cover"
          preview-disabled
        />
        <span v-else>--</span>
      </template>

      <template #updateDate="{ row }">
        <span>{{ (row as Row).updateDate ? dayjs((row as Row).updateDate).format('YYYY-MM-DD HH:mm:ss') : '--' }}</span>
      </template>

      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row as Row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="handleDelete(row as Row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ProductOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
