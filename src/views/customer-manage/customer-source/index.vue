<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchGetCustomerSourcePageList, fetchUpdateCustomerSource } from '@/service/api/customer-source';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { TableExportAction } from '@/components/Export';
import CustomerSourceOperateDrawer from './modules/customer-source-operate-drawer.vue';

const searchParams = reactive<{ keyword: string }>({
  keyword: ''
});

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('page.manage.customer.customerSourceManage.name'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.customerSourceManage.keywordPlaceholder')
  }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.CustomerSourceList,
  Api.SystemManage.CustomerSourceItem
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCustomerSourcePageList({
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
        key: 'order',
        title: $t('page.manage.customer.customerSourceManage.order'),
        visible: true,
        width: 100,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.manage.customer.customerSourceManage.name'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'note',
        title: $t('page.manage.customer.customerSourceManage.note'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'status',
        title: $t('page.manage.customer.customerSourceManage.status'),
        type: 'status',
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'customer-manage-customer-source-v1'
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

const operateVisible = ref(false);
const configVisible = ref(false);
const operateMode = ref<'create' | 'edit'>('create');
const operateRow = ref<Api.SystemManage.CustomerSourceItem | null>(null);

function openDrawer(mode: 'create' | 'edit', row?: Api.SystemManage.CustomerSourceItem) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

/** 列表操作栏启用 / 停用：复用 updateCommon 部分更新，仅传 _id + name + status（需随行 name 避免写入 nameUpdate 脏字段） */
async function handleToggleStatus(row: Api.SystemManage.CustomerSourceItem) {
  const next: Api.Common.EnableStatus = row.status === 1 ? 0 : 1;

  const { error } = await fetchUpdateCustomerSource({
    _id: row._id,
    name: row.name,
    status: next
  });
  if (error) return;

  row.status = next;
  window.$message?.success(next === 1 ? $t('common.enable') : $t('common.disable'));
}

function handleEdit(row: Api.SystemManage.CustomerSourceItem) {
  openDrawer('edit', row);
}

/** 导出用：一次拉全量（专用导出接口缺失，暂用大 size 查询） */
async function fetchAllSources(): Promise<Api.SystemManage.CustomerSourceItem[]> {
  const { data: res } = await fetchGetCustomerSourcePageList({
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
        :action-width="160"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton type="primary" @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </LButton>
            <span v-auth="'system:customerSource:export'">
              <TableExportAction
                :columns="columnConfigs"
                :data="data"
                :fetch-all="fetchAllSources"
                :filename="$t('route.customer-manage_customer-source')"
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
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <CustomerSourceOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
