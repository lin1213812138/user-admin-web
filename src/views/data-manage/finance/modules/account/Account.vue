<script setup lang="ts">
import { reactive, ref } from 'vue';
import { $t } from '@/locales';
import {
  fetchDisableTradeAccount,
  fetchGetTradeAccountList,
  fetchUpdateTradeAccount
} from '@/service/api/trade-account';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import AccountOperateDrawer from './AccountOperateDrawer.vue';

defineOptions({ name: 'Account' });

const statusOptions = useArchiveStatusOptions();

const searchParams = reactive<{
  keyword: string;
  status: Api.Common.EnableStatus | null;
}>({ keyword: '', status: null });

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManage.FinanceTradeAccountList,
  Api.DataManage.FinanceTradeAccount
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetTradeAccountList({
      current,
      size,
      keyword: searchParams.keyword,
      status: searchParams.status
    });
    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({
    records: r.list ?? [],
    total: r.total
  }),
  columns: () =>
    [
      {
        key: 'alias',
        title: $t('page.dataManage.finance.account.alias'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      { key: 'bank', title: $t('page.dataManage.finance.account.bank'), visible: true, minWidth: 160, sortable: false },
      { key: 'name', title: $t('page.dataManage.finance.account.name'), visible: true, minWidth: 160, sortable: false },
      { key: 'no', title: $t('page.dataManage.finance.account.no'), visible: true, minWidth: 180, sortable: false },
      {
        key: 'balance',
        title: $t('page.dataManage.finance.account.balance'),
        visible: true,
        width: 140,
        align: 'right',
        sortable: true
      },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 180, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  // v2：旧列配置（code/name/accountType 时代的缓存）与当前列集不兼容，升版本避免残留空列
  cacheKey: 'data-manage-finance-account-v2'
});

const configVisible = ref(false);
const checkedRows = ref<Api.DataManage.FinanceTradeAccount[]>([]);

function handleSelectionChange(records: Api.DataManage.FinanceTradeAccount[]) {
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

const operateRef = ref<InstanceType<typeof AccountOperateDrawer>>();

function openCreate() {
  operateRef.value?.open();
}

function openEdit(row: Api.DataManage.FinanceTradeAccount) {
  operateRef.value?.open(row);
}

/** 列表停用 / 启用：走 /trade-account/update 局部更新；alias 必须随行回传（后端 uniqField:'alias' 校验，缺失会误判并写入 aliasUpdate） */
async function handleToggleStatus(row: Api.DataManage.FinanceTradeAccount) {
  const { error } = await fetchUpdateTradeAccount({
    _id: row._id,
    alias: row.alias,
    status: row.status === 1 ? 0 : 1
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
}

/** 批量停用：内置项不允许停用，前端先过滤 */
async function handleBatchDisable() {
  const disableable = checkedRows.value.filter(row => row.buildIn !== 1);
  if (disableable.length < checkedRows.value.length) {
    window.$message?.warning($t('page.dataManage.finance.account.builtInDisableTip'));
  }
  if (!disableable.length) return;

  const { error } = await fetchDisableTradeAccount(disableable.map(row => row._id));
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
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
      :action-width="140"
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
            :placeholder="$t('page.dataManage.finance.account.form.keywordPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="searchParams.status"
            class="w-140px!"
            :options="statusOptions"
            :placeholder="$t('common.status')"
            clearable
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
            :disabled="checkedRows.length === 0"
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

      <!-- 账户别名 + 内置标记（写法对齐角色管理列表） -->
      <template #alias="{ row }">
        <div class="flex-y-center gap-4px">
          <span>{{ row.alias }}</span>
          <NTag v-if="row.buildIn === 1" size="small" type="info" :bordered="false">
            {{ $t('page.dataManage.finance.account.buildIn') }}
          </NTag>
        </div>
      </template>

      <template #action="{ row }">
        <LButton type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</LButton>
        <NTooltip :disabled="row.buildIn !== 1">
          <template #trigger>
            <span>
              <LButton
                :type="row.status === 1 ? 'warning' : 'success'"
                text
                :disabled="row.buildIn === 1"
                :popconfirm="row.status === 1 ? $t('common.confirmDisable') : $t('common.confirmEnable')"
                @positive-click="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
              </LButton>
            </span>
          </template>
          {{ $t('page.dataManage.finance.account.builtInDisableTip') }}
        </NTooltip>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <AccountOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
