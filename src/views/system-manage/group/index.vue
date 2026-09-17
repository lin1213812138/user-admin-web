<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import {
  fetchDeleteGroup,
  fetchGetGroupCustomerList,
  fetchGetGroupList,
  fetchGetGroupUserList
} from '@/service/api/group';
import { fetchGetSiteList } from '@/service/api/site';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import RelationModal from '@/components/common/relation-modal.vue';
import GroupOperateDrawer from './modules/group-operate-drawer.vue';

const searchParams = reactive<{ groupName: string; siteId: string | null }>({
  groupName: '',
  siteId: null
});

/** 所属站点下拉选项（来自站点管理真实接口，站点主键为字符串 _id） */
const siteOptions = ref<CommonType.Option<string>[]>([]);

async function loadSiteOptions() {
  const { data } = await fetchGetSiteList({ page: 1, size: 100 });
  siteOptions.value = (data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadSiteOptions();
});

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'groupName',
    label: $t('page.manage.group.groupName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.group.form.groupNamePlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.group.siteName'),
    type: 'select',
    span: 6,
    options: siteOptions.value,
    placeholder: $t('page.manage.group.form.siteNamePlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  { records: Api.SystemManage.Group[]; total: number },
  Api.SystemManage.Group
>({
  // 真实接口 /group/query 为 queryAllCommon 全量查询（无分页），这里拉全量后本地分页
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetGroupList({
      // 组名走 keyword 正则模糊匹配；站点 id 精确过滤（null 需 ?? 兜底）
      where: { siteId: searchParams.siteId ?? undefined },
      keyword: searchParams.groupName?.trim() || undefined,
      keywordFields: ['name']
    });

    if (error || !res) return { records: [], total: 0 };

    const start = (current - 1) * size;
    return { records: res.list.slice(start, start + size), total: res.list.length };
  },
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.group.groupName'),
        type: 'detail',
        visible: true,
        width: 140,
        sortable: false
      },
      { key: 'site', title: $t('page.manage.group.siteName'), visible: true, width: 120, sortable: false },
      {
        key: 'relationUser',
        title: $t('page.manage.group.relationUser'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      {
        key: 'relationCustomer',
        title: $t('page.manage.group.relationCustomer'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      { key: 'desc', title: $t('page.manage.group.remark'), visible: true, minWidth: 160, sortable: false },
      { key: 'creator', title: $t('page.manage.group.creator'), visible: true, width: 100, sortable: false },
      { key: 'createDate', title: $t('page.manage.group.createTime'), visible: true, width: 180, sortable: false },
      { key: 'updateBy', title: $t('page.manage.group.updateBy'), visible: true, width: 100, sortable: false },
      { key: 'updateDate', title: $t('page.manage.group.updateTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  // 新增关联用户/客户列，换新缓存 key 避免旧列配置残留
  cacheKey: 'system-manage-group-v3'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
}

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Group[]>([]);

function handleSelectionChange(records: Api.SystemManage.Group[]) {
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
  searchParams.groupName = '';
  searchParams.siteId = null;
  handleSearch();
}

async function handleDelete(ids: string[]) {
  // 后端 /group/delete 为单条删除，批量时逐条调用（组内用户/客户 groupId 由后端置空）
  await Promise.all(ids.map(id => fetchDeleteGroup(id)));
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Group | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Group) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleEdit(row: Api.SystemManage.Group) {
  openDrawer('edit', row);
}

function handleSubmitted() {
  getData();
}

/** 关联弹窗当前行（用户 / 客户弹窗共用，取数时闭包读取） */
const relationRow = ref<Api.SystemManage.Group | null>(null);
const relationUserVisible = ref(false);
const relationCustomerVisible = ref(false);

async function openRelationModal(type: 'user' | 'customer', row: Api.SystemManage.Group) {
  relationRow.value = row;

  // 先探查是否有关联数据（只取第一条判断 total），为空时仅提示、不弹窗
  const fetcher = type === 'user' ? fetchRelationUsers : fetchRelationCustomers;
  const { list, total } = await fetcher({ page: 1, size: 1 });
  if (!total && list.length === 0) {
    window.$notification?.info({ title: $t('common.noData'), duration: 3000 });
    return;
  }

  if (type === 'user') {
    relationUserVisible.value = true;
  } else {
    relationCustomerVisible.value = true;
  }
}

/** 弹窗取数：组别关联用户（/user/query where.groupIds 数组成员匹配；错误提示由 request 拦截器统一弹出，失败返回空列表） */
async function fetchRelationUsers({ page, size }: { page: number; size: number }) {
  if (!relationRow.value) return { list: [], total: 0 };

  const { data: res, error } = await fetchGetGroupUserList({ page, size, groupId: relationRow.value._id });
  if (error || !res) return { list: [], total: 0 };

  return res;
}

/** 弹窗取数：组别关联客户（/customer/query where.groupId 精确过滤） */
async function fetchRelationCustomers({ page, size }: { page: number; size: number }) {
  if (!relationRow.value) return { list: [], total: 0 };

  const { data: res, error } = await fetchGetGroupCustomerList({ page, size, groupId: relationRow.value._id });
  if (error || !res) return { list: [], total: 0 };

  return res;
}

/** 关联用户弹窗列（姓名 / 账号 / 所属站点 / 状态） */
const relationUserColumns = [
  { key: 'name', title: $t('page.manage.user.nickName'), visible: true, width: 140, sortable: false },
  { key: 'account', title: $t('page.manage.user.userName'), visible: true, width: 140, sortable: false },
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
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
        <template #createDate="{ row }">
          <span>{{ formatDate(row.createDate) }}</span>
        </template>

        <template #relationUser="{ row }">
          <NButton size="small" type="primary" text @click="openRelationModal('user', row)">
            {{ $t('page.manage.site.view') }}
          </NButton>
        </template>

        <template #relationCustomer="{ row }">
          <NButton size="small" type="primary" text @click="openRelationModal('customer', row)">
            {{ $t('page.manage.site.view') }}
          </NButton>
        </template>

        <template #updateDate="{ row }">
          <span>{{ formatDate(row.updateDate) }}</span>
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

    <GroupOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />

    <RelationModal
      v-model:show="relationUserVisible"
      :title="$t('page.manage.group.relationUser')"
      :fetcher="fetchRelationUsers"
      :columns="relationUserColumns"
    />

    <RelationModal
      v-model:show="relationCustomerVisible"
      :title="$t('page.manage.group.relationCustomer')"
      :fetcher="fetchRelationCustomers"
      :columns="relationCustomerColumns"
    />
  </div>
</template>

<style scoped></style>
