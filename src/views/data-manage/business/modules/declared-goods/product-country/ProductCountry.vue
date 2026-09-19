<script setup lang="ts">
import { reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteProductCountry, fetchGetProductCountryList } from '@/service/api/declared-goods';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import ProductCountryOperateDrawer from './ProductCountryOperateDrawer.vue';

type Row = Api.DeclaredGoods.ProductCountry;

const searchParams = reactive<{ keyword: string }>({ keyword: '' });

const { data, loading, columns, pagination, getData, resetColumns, persistColumns, columnConfigs } = useVxeTable<
  Api.DeclaredGoods.QueryResult<Row>,
  Row
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetProductCountryList({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined,
      keywordFields: ['code', 'name', 'nameCn']
    });

    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.declaredGoods.fields.code'),
        type: 'detail',
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'nameCn',
        title: $t('page.dataManage.business.declaredGoods.fields.nameCn'),
        visible: true,
        sortable: false
      },
      {
        key: 'nameEn',
        title: $t('page.dataManage.business.declaredGoods.fields.nameEn'),
        visible: true,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.dataManage.business.declaredGoods.fields.name'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'code2',
        title: $t('page.dataManage.business.declaredGoods.fields.code2'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'code3',
        title: $t('page.dataManage.business.declaredGoods.fields.code3'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-business-declared-goods-product-country'
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
  searchParams.keyword = '';
  handleSearch();
}

const configVisible = ref(false);
const operateRef = ref<InstanceType<typeof ProductCountryOperateDrawer>>();

function openCreate() {
  operateRef.value?.openCreate();
}

function openEdit(row: Row) {
  operateRef.value?.openEdit(row);
}

async function handleDelete(row: Row) {
  if (!row._id) return;
  const { error } = await fetchDeleteProductCountry(row._id);
  if (error) return;

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
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="searchParams.keyword"
            class="w-260px!"
            :placeholder="$t('common.keyword')"
            @keyup.enter="handleSearch"
          />
        </div>
      </template>

      <template #operation-left>
        <LButton type="primary" @click="openCreate">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          {{ $t('common.add') }}
        </LButton>
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
        <LButton type="primary" text @click="openEdit(row as Row)">{{ $t('common.edit') }}</LButton>
        <LButton type="error" text popconfirm @positive-click="handleDelete(row as Row)">
          {{ $t('common.delete') }}
        </LButton>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ProductCountryOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
