<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDisableFeeType, fetchGetFeeTypeList, fetchUpdateFeeType } from '@/service/api/fee-type';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import ExpenseTypeOperateDrawer from './ExpenseTypeOperateDrawer.vue';
import { buildExpenseScopeOptions, formatExpenseScope } from './constants';

defineOptions({ name: 'ExpenseType' });

const statusOptions = useArchiveStatusOptions();
const scopeOptions = computed(buildExpenseScopeOptions);

const searchParams = reactive<{
  keyword: string;
  status: Api.Common.EnableStatus | null;
  scope: number | null;
}>({ keyword: '', status: null, scope: null });

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManage.FinanceExpenseTypeList,
  Api.DataManage.FinanceExpenseType
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetFeeTypeList({
      current,
      size,
      keyword: searchParams.keyword,
      status: searchParams.status,
      scope: searchParams.scope
    });
    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({
    // 后端 createDate 为毫秒时间戳，列表统一格式化为可读时间（同 MasterDataArchive）
    records: (r.list ?? []).map(it => ({
      ...it,
      createTime: it.createDate ? dayjs(it.createDate).format('YYYY-MM-DD HH:mm:ss') : ''
    })),
    total: r.total
  }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.finance.expenseType.name'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'scope',
        title: $t('page.dataManage.finance.expenseType.scope'),
        visible: true,
        minWidth: 200,
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.finance.expenseType.order'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 180, sortable: false },
      {
        key: 'creator',
        title: $t('page.dataManage.finance.expenseType.creator'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'createTime',
        title: $t('page.dataManage.finance.expenseType.createTime'),
        visible: true,
        width: 180,
        sortable: false
      }
    ] as VxeColumnConfig[],
  // v2：旧列配置（code/scope/remark 时代的缓存）与当前列集不兼容，升版本避免残留空列
  cacheKey: 'data-manage-finance-expense-type-v2'
});

const configVisible = ref(false);
const checkedRows = ref<Api.DataManage.FinanceExpenseType[]>([]);

function handleSelectionChange(records: Api.DataManage.FinanceExpenseType[]) {
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
  searchParams.scope = null;
  handleSearch();
}

const operateRef = ref<InstanceType<typeof ExpenseTypeOperateDrawer>>();

function openCreate() {
  operateRef.value?.open();
}

function openEdit(row: Api.DataManage.FinanceExpenseType) {
  operateRef.value?.open(row);
}

/** 列表停用 / 启用：走 /fee-type/update 局部更新；name 必须随行回传（后端 uniqField:'name' 校验，缺失会误判并写入 nameUpdate） */
async function handleToggleStatus(row: Api.DataManage.FinanceExpenseType) {
  const { error } = await fetchUpdateFeeType({
    _id: row._id,
    name: row.name,
    status: row.status === 1 ? 0 : 1
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
}

/** 批量停用：内置项不允许停用，前端先过滤（对齐角色页批量删除的跳过提示） */
async function handleBatchDisable() {
  const disableable = checkedRows.value.filter(row => row.buildIn !== 1);
  if (disableable.length < checkedRows.value.length) {
    window.$message?.warning($t('page.dataManage.finance.expenseType.builtInDisableTip'));
  }
  if (!disableable.length) return;

  const { error } = await fetchDisableFeeType(disableable.map(row => row._id));
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
            :placeholder="$t('page.dataManage.finance.expenseType.form.keywordPlaceholder')"
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
          <NSelect
            v-model:value="searchParams.scope"
            class="w-180px!"
            :options="scopeOptions"
            :placeholder="$t('page.dataManage.finance.expenseType.scope')"
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

      <!-- 费用名称 + 内置标记（写法对齐角色管理列表） -->
      <template #name="{ row }">
        <div class="flex-y-center gap-4px">
          <span>{{ row.name }}</span>
          <NTag v-if="row.buildIn === 1" size="small" type="info" :bordered="false">
            {{ $t('page.dataManage.finance.expenseType.builtIn') }}
          </NTag>
        </div>
      </template>

      <template #scope="{ row }">
        <span>{{ formatExpenseScope(row.scope, scopeOptions) }}</span>
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
          {{ $t('page.dataManage.finance.expenseType.builtInDisableTip') }}
        </NTooltip>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ExpenseTypeOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
