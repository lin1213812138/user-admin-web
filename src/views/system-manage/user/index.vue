<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteUser, fetchGetUserCustomerList, fetchGetUserList } from '@/service/api/user';
import { fetchGetSiteList } from '@/service/api/site';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { TableExportAction } from '@/components/Export';
import RelationModal from '@/components/common/relation-modal.vue';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserEditDrawer from './modules/user-edit-drawer.vue';

const searchParams = reactive<{ keyword: string; siteId: string | null; status: Api.Common.EnableStatus | null }>({
  keyword: '',
  siteId: null,
  status: null
});

/** 所属站点下拉选项（来自站点管理真实接口，站点主键为字符串 _id） */
const siteOptions = ref<CommonType.Option<string>[]>([]);

async function loadSiteOptions() {
  const { data } = await fetchGetSiteList({ page: 1, size: 100 });
  siteOptions.value = (data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

loadSiteOptions();

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('page.manage.user.keyword'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.user.form.keywordPlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.user.siteName'),
    type: 'select',
    span: 6,
    options: siteOptions.value,
    placeholder: $t('page.manage.user.form.siteNamePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.user.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.user.form.statusPlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  { records: Api.SystemManage.User[]; total: number },
  Api.SystemManage.User
>({
  // 真实接口 /user/query 为 queryCommon 服务端分页（keyword 匹配 name/fullName/account）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetUserList({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined,
      where: {
        // null 需 ?? 兜底为 undefined，避免把空值当过滤条件
        siteId: searchParams.siteId ?? undefined,
        status: searchParams.status ?? undefined
      }
    });

    if (error || !res) return { records: [], total: 0 };

    return { records: res.list, total: res.total };
  },
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'account',
        title: $t('page.manage.user.userName'),
        type: 'detail',
        visible: true,
        width: 140,
        sortable: false
      },
      { key: 'name', title: $t('page.manage.user.nickName'), visible: true, width: 120, sortable: false },
      { key: 'site', title: $t('page.manage.user.siteName'), visible: true, width: 120, sortable: false },
      { key: 'group', title: $t('page.manage.user.groupName'), visible: true, width: 140, sortable: false },
      { key: 'role', title: $t('page.manage.user.roleName'), visible: true, width: 140, sortable: false },
      { key: 'phone', title: $t('page.manage.user.contactPhone'), visible: true, width: 140, sortable: false },
      { key: 'job', title: $t('page.manage.user.position'), visible: true, width: 120, sortable: false },
      {
        key: 'status',
        title: $t('page.manage.user.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      },
      { key: 'createDate', title: $t('page.manage.user.createTime'), visible: true, width: 180, sortable: false },
      {
        key: 'relationCustomer',
        title: $t('page.manage.user.relationCustomer'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      }
    ] as VxeColumnConfig[],
  // 新增关联客户列，换新缓存 key 避免旧列配置残留
  cacheKey: 'system-manage-user-v3'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
}

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.User[]>([]);

function handleSelectionChange(records: Api.SystemManage.User[]) {
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
  searchParams.siteId = null;
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: string[]) {
  // 后端 /user/delete 为单条删除，批量时逐条调用（管理员账号/本人/绑定客户的业务员由后端拒绝）
  await Promise.all(ids.map(id => fetchDeleteUser(id)));
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.User | null>(null);

/** 编辑抽屉（基本信息 + 多 tab），与新增/详情抽屉分离 */
const editVisible = ref(false);
const editRow = ref<Api.SystemManage.User | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.User) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.User) {
  openDrawer('detail', row);
}

/** 编辑打开侧滑抽屉（基本信息 + 多 tab），新增 / 详情仍走 UserOperateDrawer */
function handleEdit(row: Api.SystemManage.User) {
  editRow.value = row;
  editVisible.value = true;
}

function handleSubmitted() {
  getData();
}

/** 导出用：一次拉全量用户（专用导出接口缺失，暂用大 size 查询） */
async function fetchAllUsers(): Promise<Api.SystemManage.User[]> {
  const { data: res } = await fetchGetUserList({ page: 1, size: 9999 });
  return res?.list ?? [];
}

/** 关联客户弹窗当前行（取数时闭包读取） */
const relationRow = ref<Api.SystemManage.User | null>(null);
const relationCustomerVisible = ref(false);

async function openRelationModal(row: Api.SystemManage.User) {
  relationRow.value = row;

  // 先探查是否有关联数据（只取第一条判断 total），为空时仅提示、不弹窗
  const { list, total } = await fetchRelationCustomers({ page: 1, size: 1 });
  if (!total && list.length === 0) {
    window.$notification?.info({ title: $t('common.noData'), duration: 3000 });
    return;
  }

  relationCustomerVisible.value = true;
}

/** 弹窗取数：用户关联客户（/customer/user/query，带 userId 后端按销售/客服/财务 $or 过滤） */
async function fetchRelationCustomers({ page, size }: { page: number; size: number }) {
  if (!relationRow.value) return { list: [], total: 0 };

  const { data: res, error } = await fetchGetUserCustomerList({ page, size, userId: relationRow.value._id });
  if (error || !res) return { list: [], total: 0 };

  return res;
}

/** 关联客户弹窗列（编码 / 名称 / 所属站点 / 状态） */
const relationCustomerColumns = [
  { key: 'code', title: $t('page.manage.site.customerCode'), visible: true, width: 140, sortable: false },
  { key: 'name', title: $t('page.manage.site.customerName'), visible: true, minWidth: 160, sortable: false },
  { key: 'site', title: $t('page.manage.site.siteName'), visible: true, minWidth: 140, sortable: false },
  {
    key: 'status',
    title: $t('page.manage.user.status'),
    type: 'status',
    visible: true,
    width: 90,
    sortable: false,
    align: 'center'
  }
] as VxeColumnConfig[];
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-16px">
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
        :action-width="120"
        action-export
        :export-filename="$t('route.system-manage_user')"
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

        <template #relationCustomer="{ row }">
          <NButton size="small" type="primary" text @click="openRelationModal(row)">
            {{ $t('page.manage.site.view') }}
          </NButton>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" ghost @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
            <NPopconfirm
              :disabled="checkedRows.length === 0"
              @positive-click="handleDelete(checkedRows.map(i => i._id))"
            >
              <template #trigger>
                <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
                  <template #icon>
                    <icon-mdi-delete class="text-icon" />
                  </template>
                  {{ $t('common.batchDelete') }}
                </NButton>
              </template>
              {{ $t('common.confirmDelete') }}
            </NPopconfirm>
            <TableExportAction
              :columns="columnConfigs"
              :data="data"
              :checked-data="checkedRows"
              :fetch-all="fetchAllUsers"
              :filename="$t('route.system-manage_user')"
            />
          </NSpace>
        </template>

        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </NButton>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="handleEdit(row)">{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete([row._id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <UserOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />

    <UserEditDrawer v-model:show="editVisible" :row="editRow" @submitted="handleSubmitted" />

    <RelationModal
      v-model:show="relationCustomerVisible"
      :title="$t('page.manage.user.relationCustomer')"
      :fetcher="fetchRelationCustomers"
      :columns="relationCustomerColumns"
    />
  </div>
</template>

<style scoped></style>
