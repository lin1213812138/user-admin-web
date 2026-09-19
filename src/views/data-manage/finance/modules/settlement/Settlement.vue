<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { fetchDisableBillMode, fetchGetBillModePageList, fetchUpdateBillMode } from '@/service/api/bill-mode';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import SettlementOperateDrawer from './SettlementOperateDrawer.vue';
import {
  buildBillGenStatusOptions,
  buildBillPeriodOptions,
  formatBillDay,
  formatBillGenStatus,
  formatBillPeriod
} from './constants';

defineOptions({ name: 'Settlement' });

const statusOptions = useArchiveStatusOptions();
const periodOptions = computed(buildBillPeriodOptions);
const genStatusOptions = computed(buildBillGenStatusOptions);

const searchParams = reactive<{ keyword: string; status: Api.Common.EnableStatus | null }>({
  keyword: '',
  status: null
});

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.BillModeList,
  Api.SystemManage.BillModeItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetBillModePageList({
      current,
      size,
      keyword: searchParams.keyword,
      status: searchParams.status
    });
    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({
    // 后端 createDate 为毫秒时间戳，列表统一格式化为可读时间（同费用类型）
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
        title: $t('page.dataManage.finance.settlement.name'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'billPeriod',
        title: $t('page.dataManage.finance.settlement.billPeriod'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'billDay',
        title: $t('page.dataManage.finance.settlement.billDay'),
        visible: true,
        width: 130,
        sortable: false
      },
      {
        key: 'billGenStatus',
        title: $t('page.dataManage.finance.settlement.billGenStatus'),
        visible: true,
        minWidth: 200,
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.finance.settlement.order'),
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
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 160, sortable: false },
      {
        key: 'creator',
        title: $t('page.dataManage.finance.settlement.creator'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'createTime',
        title: $t('page.dataManage.finance.settlement.createTime'),
        visible: true,
        width: 180,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-finance-settlement-v2'
});

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.BillModeItem[]>([]);

function handleSelectionChange(records: Api.SystemManage.BillModeItem[]) {
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

const operateRef = ref<InstanceType<typeof SettlementOperateDrawer>>();

function openCreate() {
  operateRef.value?.open();
}

function openEdit(row: Api.SystemManage.BillModeItem) {
  operateRef.value?.open(row);
}

/** 列表停用 / 启用：走 /bill-mode/update 局部更新；name 必须随行回传（后端 uniqField:'name' 校验） */
async function handleToggleStatus(row: Api.SystemManage.BillModeItem) {
  const { error } = await fetchUpdateBillMode({
    _id: row._id,
    name: row.name,
    status: row.status === 1 ? 0 : 1
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
}

/** 批量停用：内置项不允许停用，前端先过滤（后端 disable 本身也会跳过 buildIn=1） */
async function handleBatchDisable() {
  const disableable = checkedRows.value.filter(row => row.buildIn !== 1);
  if (disableable.length < checkedRows.value.length) {
    window.$message?.warning($t('page.dataManage.finance.settlement.builtInDisableTip'));
  }
  if (!disableable.length) return;

  const { error } = await fetchDisableBillMode(disableable.map(row => row._id));
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
            :placeholder="$t('page.dataManage.finance.settlement.form.keywordPlaceholder')"
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

      <!-- 结算名称 + 内置标记（写法对齐角色管理 / 费用类型列表） -->
      <template #name="{ row }">
        <div class="flex-y-center gap-4px">
          <span>{{ row.name }}</span>
          <NTag v-if="row.buildIn === 1" size="small" type="info" :bordered="false">
            {{ $t('page.dataManage.finance.settlement.builtIn') }}
          </NTag>
        </div>
      </template>

      <template #billPeriod="{ row }">
        <span>{{ formatBillPeriod(row.billPeriod, periodOptions) }}</span>
      </template>

      <template #billDay="{ row }">
        <span>{{ formatBillDay(row.billPeriod, row.billDay) }}</span>
      </template>

      <template #billGenStatus="{ row }">
        <span>{{ formatBillGenStatus(row.billGenStatus, genStatusOptions) }}</span>
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
          {{ $t('page.dataManage.finance.settlement.builtInDisableTip') }}
        </NTooltip>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <SettlementOperateDrawer ref="operateRef" @submitted="getData" />
  </div>
</template>

<style scoped></style>
