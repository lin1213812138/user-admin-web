<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchGetCustomerLevelList, fetchGetCustomerList, fetchGetCustomerSourceList } from '@/service/api/customer';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import CustomerOperateDrawer from './modules/customer-operate-drawer.vue';
import CustomerDetailDrawer from './modules/customer-detail-drawer.vue';

const searchParams = reactive<{
  keyword: string;
  levelId: string | null;
  sourceId: string | null;
  status: Api.Common.EnableStatus | null;
}>({
  keyword: '',
  levelId: null,
  sourceId: null,
  status: null
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 客户等级 / 来源下拉（/customer-level/query、/customer-source/query 字典） */
const levelOptions = ref<CommonType.Option<string>[]>([]);
const sourceOptions = ref<CommonType.Option<string>[]>([]);

function toOptions(list: { _id: string; name: string }[]): CommonType.Option<string>[] {
  return list.map(item => ({ label: item.name, value: item._id }));
}

async function loadDictOptions() {
  const [levelRes, sourceRes] = await Promise.all([fetchGetCustomerLevelList(), fetchGetCustomerSourceList()]);
  levelOptions.value = toOptions(levelRes.data?.list ?? []);
  sourceOptions.value = toOptions(sourceRes.data?.list ?? []);
}

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('page.manage.customer.keyword'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.customer.form.keywordPlaceholder')
  },
  {
    key: 'levelId',
    label: $t('page.manage.customer.customerLevel'),
    type: 'select',
    span: 6,
    options: levelOptions.value,
    placeholder: $t('page.manage.customer.form.levelPlaceholder')
  },
  {
    key: 'sourceId',
    label: $t('page.manage.customer.customerSource'),
    type: 'select',
    span: 6,
    options: sourceOptions.value,
    placeholder: $t('page.manage.customer.form.sourcePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.customer.form.statusPlaceholder')
  }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.CustomerList,
  Api.SystemManage.Customer
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCustomerList({
      page: current,
      size,
      // scene=1 管理列表：不强制 status=1，状态筛选交给 where
      scene: 1,
      keyword: searchParams.keyword?.trim() || undefined,
      where: {
        levelId: searchParams.levelId ?? undefined,
        sourceId: searchParams.sourceId ?? undefined,
        // 状态 0（停用）是有效值，须用 ?? 兜底而不是 ||
        status: searchParams.status ?? undefined
      },
      sort: { createDate: -1 }
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // tms-user 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.manage.customer.customerCode'),
        type: 'detail',
        visible: true,
        width: 100,
        sortable: false
      },
      { key: 'name', title: $t('page.manage.customer.customerName'), visible: true, width: 160, sortable: false },
      { key: 'account', title: $t('page.manage.customer.account'), visible: true, width: 110, sortable: false },
      { key: 'contact', title: $t('page.manage.customer.contactName'), visible: true, width: 90, sortable: false },
      { key: 'mobile', title: $t('page.manage.customer.contactPhone'), visible: true, width: 120, sortable: false },
      { key: 'email', title: $t('page.manage.customer.email'), visible: true, width: 150, sortable: false },
      { key: 'address', title: $t('page.manage.customer.address'), visible: true, minWidth: 160, sortable: false },
      { key: 'salesman', title: $t('page.manage.customer.salesman'), visible: true, width: 90, sortable: false },
      { key: 'service', title: $t('page.manage.customer.service'), visible: true, width: 90, sortable: false },
      { key: 'group', title: $t('page.manage.customer.group'), visible: true, width: 100, sortable: false },
      { key: 'source', title: $t('page.manage.customer.customerSource'), visible: true, width: 100, sortable: false },
      { key: 'creditLimit', title: $t('page.manage.customer.creditLimit'), visible: true, width: 100, sortable: false },
      {
        key: 'status',
        title: $t('page.manage.customer.status'),
        type: 'status',
        visible: true,
        width: 80,
        sortable: false,
        align: 'center'
      },
      {
        key: 'webStatus',
        title: $t('page.manage.customer.webStatus'),
        type: 'status',
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      { key: 'createDate', title: $t('page.manage.customer.createDate'), visible: true, width: 160, sortable: true }
    ] as VxeColumnConfig[],
  // 列结构按老系统对齐调整，换新缓存 key 避免旧列配置残留
  cacheKey: 'customer-manage-customer-v3'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
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
  searchParams.levelId = null;
  searchParams.sourceId = null;
  searchParams.status = null;
  handleSearch();
}

const operateVisible = ref(false);
const detailVisible = ref(false);
const detailId = ref('');
const configVisible = ref(false);
/** 勾选行暂仅作状态保留（删除接口就绪后启用批量删除） */
const checkedRows = ref<Api.SystemManage.Customer[]>([]);

function handleSelectionChange(records: Api.SystemManage.Customer[]) {
  checkedRows.value = records;
}
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Customer | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Customer) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

/** 客户编码点击 → 打开客户详情弹窗 */
function handleDetail(row: Api.SystemManage.Customer) {
  detailId.value = row._id;
  detailVisible.value = true;
}

function handleEdit(row: Api.SystemManage.Customer) {
  openDrawer('edit', row);
}

function handleSubmitted() {
  getData();
}

onMounted(() => {
  loadDictOptions();
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
        :show-checkbox="true"
        :show-action="true"
        :action-width="140"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
        <template #createDate="{ row }">
          <span>{{ formatDate(row.createDate) }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton type="primary" @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </LButton>
            <!-- 后端暂无 /customer/delete 接口，按钮先保留并禁用 -->
            <LButton type="error" disabled :tooltip="$t('page.manage.customer.deleteDisabledTip')">
              <template #icon>
                <icon-mdi-delete class="text-icon" />
              </template>
              {{ $t('common.batchDelete') }}
            </LButton>
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
          <NButton size="small" type="primary" text @click="handleEdit(row)">{{ $t('common.edit') }}</NButton>
          <!-- 后端暂无 /customer/delete 接口，按钮先保留并禁用 -->
          <NTooltip>
            <template #trigger>
              <span>
                <NButton size="small" type="error" text disabled>{{ $t('common.delete') }}</NButton>
              </span>
            </template>
            {{ $t('page.manage.customer.deleteDisabledTip') }}
          </NTooltip>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <CustomerOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />

    <CustomerDetailDrawer v-model:show="detailVisible" :customer-id="detailId" />
  </div>
</template>

<style scoped></style>
