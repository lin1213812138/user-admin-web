<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import {
  fetchDeleteCustomerLevel,
  fetchGetCustomerLevelPageList,
  fetchUpdateCustomerLevel
} from '@/service/api/customer-level';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { TableExportAction } from '@/components/Export';
import CustomerLevelOperateDrawer from './modules/customer-level-operate-drawer.vue';

const searchParams = reactive<{ keyword: string }>({
  keyword: ''
});

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('page.manage.customer.customerLevelManage.name'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.customerLevelManage.keywordPlaceholder')
  }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.CustomerLevelList,
  Api.SystemManage.CustomerLevelItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCustomerLevelPageList({
      current,
      size,
      keyword: searchParams.keyword?.trim() || undefined
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'num',
        title: $t('page.manage.customer.customerLevelManage.num'),
        visible: true,
        width: 100,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.manage.customer.customerLevelManage.name'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'limitDays',
        title: $t('page.manage.customer.customerLevelManage.limitDays'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'limitFeeSpent',
        title: $t('page.manage.customer.customerLevelManage.limitFeeSpent'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'feeShipRate',
        title: $t('page.manage.customer.customerLevelManage.feeShipRate'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'status',
        title: $t('page.manage.customer.customerLevelManage.status'),
        type: 'status',
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'updateBy',
        title: $t('page.manage.customer.customerLevelManage.updateBy'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.manage.customer.customerLevelManage.updateDate'),
        visible: true,
        width: 180,
        sortable: true
      }
    ] as VxeColumnConfig[],
  cacheKey: 'customer-manage-customer-level-v1'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
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

const operateVisible = ref(false);
const configVisible = ref(false);
const operateMode = ref<'create' | 'edit'>('create');
const operateRow = ref<Api.SystemManage.CustomerLevelItem | null>(null);

function openDrawer(mode: 'create' | 'edit', row?: Api.SystemManage.CustomerLevelItem) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

/** 列表操作栏启用 / 停用：复用 updateCommon 部分更新，仅传 _id + name + status（需随行 name 避免写入 nameUpdate 脏字段） */
async function handleToggleStatus(row: Api.SystemManage.CustomerLevelItem) {
  const next: Api.Common.EnableStatus = row.status === 1 ? 0 : 1;

  const { error } = await fetchUpdateCustomerLevel({
    _id: row._id,
    name: row.name,
    status: next
  });
  if (error) return;

  row.status = next;
  window.$message?.success(next === 1 ? $t('common.enable') : $t('common.disable'));
}

function handleEdit(row: Api.SystemManage.CustomerLevelItem) {
  openDrawer('edit', row);
}

async function handleDelete(row: Api.SystemManage.CustomerLevelItem) {
  const { error } = await fetchDeleteCustomerLevel(row._id);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  handleSearch();
}

/** 导出用：一次拉全量（专用导出接口缺失，暂用大 size 查询） */
async function fetchAllLevels(): Promise<Api.SystemManage.CustomerLevelItem[]> {
  const { data: res } = await fetchGetCustomerLevelPageList({
    current: 1,
    size: 9999,
    keyword: searchParams.keyword?.trim() || undefined
  });
  return res?.list ?? [];
}

function handleSubmitted() {
  getData();
}

onMounted(() => {
  getData();
});
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-10px">
    <div class="flex-1 min-h-0">
      <Table
        :search-items="searchItems"
        :search-model="searchParams"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="140"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #updateDate="{ row }">
          <span>{{ formatDate(row.updateDate) }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton type="primary" @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </LButton>
            <span v-auth="'system:customerLevel:export'">
              <TableExportAction
                :columns="columnConfigs"
                :data="data"
                :fetch-all="fetchAllLevels"
                :filename="$t('route.customer-manage_customer-level')"
              />
            </span>
          </NSpace>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton circle @click="configVisible = true">
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

        <template #action="{ row }">
          <LButton type="primary" text @click="handleEdit(row)">{{ $t('common.edit') }}</LButton>
          <LButton
            :type="row.status === 1 ? 'warning' : 'success'"
            text
            :popconfirm="row.status === 1 ? $t('common.confirmDisable') : $t('common.confirmEnable')"
            @positive-click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
          </LButton>
          <LButton type="error" text popconfirm="确认删除该客户等级？" @positive-click="handleDelete(row)">
            {{ $t('common.delete') }}
          </LButton>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <CustomerLevelOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
