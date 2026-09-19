<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDisableCurrency, fetchGetCurrencyList, fetchUpdateCurrency } from '@/service/api/currency';
import CurrencyOperateDrawer from './CurrencyOperateDrawer.vue';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { useCountrySelect } from '@/hooks/business/use-country-select';

defineOptions({ name: 'FinanceCurrency' });

const { getName: getCountryName, load: loadCountries } = useCountrySelect();

onMounted(loadCountries);

const searchParams = reactive<{ keyword: string }>({ keyword: '' });

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManage.FinanceCurrencyList,
  Api.DataManage.FinanceCurrency
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCurrencyList({ current, size, keyword: searchParams.keyword });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({
    records: (r.list ?? []).map(it => ({
      ...it,
      createTime: it.createDate ? dayjs(it.createDate).format('YYYY-MM-DD HH:mm:ss') : ''
    })),
    total: r.total
  }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.currency.code'),
        type: 'detail',
        visible: true,
        minWidth: 130,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.dataManage.finance.currency.name'),
        type: 'detail',
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'countryId',
        title: $t('page.dataManage.finance.currency.country'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'local',
        title: $t('page.dataManage.finance.currency.local'),
        type: 'detail',
        visible: true,
        width: 110,
        align: 'center',
        sortable: false
      },
      {
        key: 'rate',
        title: $t('page.dataManage.finance.currency.rate'),
        type: 'detail',
        visible: true,
        width: 110,
        align: 'right',
        sortable: false
      },
      {
        key: 'status',
        title: $t('page.dataManage.finance.currency.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-finance-currency-v2'
});

const configVisible = ref(false);
const checkedRows = ref<Api.DataManage.FinanceCurrency[]>([]);

function handleSelectionChange(records: Api.DataManage.FinanceCurrency[]) {
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

const operateRef = ref<InstanceType<typeof CurrencyOperateDrawer>>();

function openCreate() {
  operateRef.value?.open();
}

function openEdit(row: Api.DataManage.FinanceCurrency) {
  operateRef.value?.open(row);
}

/** 列表停用 / 启用：走 /currency/update 局部更新；code 必须随行回传（后端 uniqField:'code'，缺失会写脏字段） */
async function handleToggleStatus(row: Api.DataManage.FinanceCurrency) {
  const { error } = await fetchUpdateCurrency({
    _id: row._id,
    code: row.code,
    name: row.name,
    countryId: row.countryId,
    local: row.local,
    rate: row.rate ?? 1,
    status: row.status === 1 ? 0 : 1
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
}

const hasChecked = computed(() => checkedRows.value.length > 0);

/** 批量停用：置 status=0（无 delete 路由） */
async function handleBatchDisable() {
  const ids = checkedRows.value.map(row => row._id);
  const { error } = await fetchDisableCurrency(ids);
  if (error) return;

  window.$message?.success($t('common.batchDisableSuccess'));
  checkedRows.value = [];
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
      :action-width="100"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="searchParams.keyword"
            class="w-220px!"
            :placeholder="$t('page.dataManage.finance.currency.keywordPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
          <LButton type="primary" @click="handleSearch">
            <template #icon>
              <icon-ic-round-search class="text-icon" />
            </template>
            {{ $t('common.search') }}
          </LButton>
          <LButton @click="handleReset">
            <template #icon>
              <icon-mdi-refresh class="text-icon" />
            </template>
            {{ $t('common.reset') }}
          </LButton>
        </div>
      </template>

      <template #operation-left>
        <NSpace justify="start" wrap>
          <LButton type="primary" ghost @click="openCreate">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            {{ $t('common.add') }}
          </LButton>
          <LButton
            type="error"
            ghost
            :disabled="!hasChecked"
            :popconfirm="$t('common.confirmDisable')"
            @positive-click="handleBatchDisable"
          >
            <template #icon>
              <icon-mdi-block-helper class="text-icon" />
            </template>
            {{ $t('common.batchDisable') }}
          </LButton>
        </NSpace>
      </template>

      <template #operation-right>
        <NSpace justify="end" wrap>
          <LButton circle :tooltip="$t('common.columnSetting')" @click="configVisible = true">
            <template #icon>
              <icon-mdi-cog class="text-icon" />
            </template>
          </LButton>
          <LButton circle :tooltip="$t('common.refresh')" @click="getData">
            <template #icon>
              <icon-mdi-refresh class="text-icon" />
            </template>
          </LButton>
        </NSpace>
      </template>

      <template #countryId="{ row }">
        <span>{{ getCountryName(row.countryId) }}</span>
      </template>

      <template #local="{ row }">
        <NTag :type="row.local === 1 ? 'success' : 'default'">
          {{
            row.local === 1
              ? $t('page.dataManage.finance.currency.localDomestic')
              : $t('page.dataManage.finance.currency.localForeign')
          }}
        </NTag>
      </template>

      <template #rate="{ row }">
        <span>{{ row.rate ?? 1 }}</span>
      </template>

      <template #action="{ row }">
        <LButton type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton
          :type="row.status === 1 ? 'warning' : 'success'"
          text
          :popconfirm="row.status === 1 ? $t('common.confirmDisable') : $t('common.confirmEnable')"
          @positive-click="handleToggleStatus(row)"
        >
          {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
        </LButton>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <CurrencyOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
