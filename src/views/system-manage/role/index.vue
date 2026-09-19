<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteRole, fetchGetRoleList, fetchGetRoleUserList } from '@/service/api/role';
import Link from '@/components/common/link.vue';
import RelationModal from '@/components/common/relation-modal.vue';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';
import RolePermissionDrawer from './modules/role-permission-drawer.vue';

const searchParams = reactive<{ name: string; roleType: Api.SystemManage.RoleType | null }>({
  name: '',
  roleType: null
});

/** 角色类型下拉选项（后端 RoleType：0-客服 1-销售 2-操作 3-财务 4-经理 100-管理员） */
const roleTypeOptions = computed<CommonType.Option<Api.SystemManage.RoleType>[]>(() => [
  { label: $t('page.manage.role.roleTypes.service'), value: 0 },
  { label: $t('page.manage.role.roleTypes.sales'), value: 1 },
  { label: $t('page.manage.role.roleTypes.operation'), value: 2 },
  { label: $t('page.manage.role.roleTypes.finance'), value: 3 },
  { label: $t('page.manage.role.roleTypes.manager'), value: 4 },
  { label: $t('page.manage.role.roleTypes.admin'), value: 100 }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.role.roleName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.role.form.roleNamePlaceholder')
  },
  {
    key: 'roleType',
    label: $t('page.manage.role.roleType'),
    type: 'select',
    span: 6,
    options: roleTypeOptions.value,
    placeholder: $t('page.manage.role.form.roleTypePlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  { records: Api.SystemManage.Role[]; total: number },
  Api.SystemManage.Role
>({
  // 真实接口 /role/query 为 queryAllCommon 全量查询（无分页），这里拉全量后本地分页
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetRoleList({
      // 角色名走 keyword 正则模糊匹配；角色类型精确过滤（null 需 ?? 兜底）
      where: { roleType: searchParams.roleType ?? undefined },
      keyword: searchParams.name?.trim() || undefined,
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
        title: $t('page.manage.role.roleName'),
        visible: true,
        width: 140,
        sortable: false
      },
      {
        key: 'roleType',
        title: $t('page.manage.role.roleType'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'relationUser',
        title: $t('page.manage.role.relationUser'),
        visible: true,
        width: 90,
        sortable: false,
        align: 'center'
      },
      { key: 'desc', title: $t('page.manage.role.desc'), visible: true, minWidth: 160, sortable: false },
      { key: 'order', title: $t('page.manage.role.order'), visible: true, width: 80, align: 'center', sortable: true },
      // { key: 'dataAuths', title: $t('page.manage.role.dataAuths'), visible: true, minWidth: 180, sortable: false },
      { key: 'creator', title: $t('page.manage.role.creator'), visible: true, width: 100, sortable: false },
      { key: 'createDate', title: $t('page.manage.role.createTime'), visible: true, width: 180, sortable: false },
      { key: 'updateBy', title: $t('page.manage.role.updateBy'), visible: true, width: 100, sortable: false },
      { key: 'updateDate', title: $t('page.manage.role.updateTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  // 新增关联用户列，换新缓存 key 避免旧列配置残留
  cacheKey: 'system-manage-role-v3'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
}

/** 角色类型文案 */
function roleTypeLabel(roleType?: Api.SystemManage.RoleType) {
  const map: Record<Api.SystemManage.RoleType, string> = {
    0: $t('page.manage.role.roleTypes.service'),
    1: $t('page.manage.role.roleTypes.sales'),
    2: $t('page.manage.role.roleTypes.operation'),
    3: $t('page.manage.role.roleTypes.finance'),
    4: $t('page.manage.role.roleTypes.manager'),
    100: $t('page.manage.role.roleTypes.admin')
  };
  return roleType === undefined ? '--' : map[roleType];
}

/** 数据权限文案 */
function dataAuthLabels(dataAuths?: Api.SystemManage.RoleDataAuth[]) {
  if (!dataAuths?.length) return '--';
  const map: Record<Api.SystemManage.RoleDataAuth, string> = {
    0: $t('page.manage.role.dataAuthOptions.user'),
    1: $t('page.manage.role.dataAuthOptions.group')
  };
  return dataAuths.map(item => map[item]).join('、');
}

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Role[]>([]);

function handleSelectionChange(records: Api.SystemManage.Role[]) {
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
  searchParams.name = '';
  searchParams.roleType = null;
  handleSearch();
}

async function handleDelete(rows: Api.SystemManage.Role[]) {
  // 后端 /role/delete 为单条删除，批量时逐条调用；内置角色（buildIn=1）不可删除，自动跳过
  const deletable = rows.filter(row => row.buildIn !== 1);
  if (deletable.length < rows.length) {
    window.$message?.warning($t('page.manage.role.builtInBatchDeleteTip'));
  }
  if (!deletable.length) return;
  await Promise.all(deletable.map(row => fetchDeleteRole(row._id)));
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Role | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Role) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleEdit(row: Api.SystemManage.Role) {
  openDrawer('edit', row);
}

const permissionVisible = ref(false);
const permissionRow = ref<Api.SystemManage.Role | null>(null);

function openPermissionDrawer(row: Api.SystemManage.Role) {
  permissionRow.value = row;
  permissionVisible.value = true;
}

/** 关联用户弹窗当前行（取数时闭包读取） */
const relationRow = ref<Api.SystemManage.Role | null>(null);
const relationUserVisible = ref(false);

async function openRelationModal(row: Api.SystemManage.Role) {
  relationRow.value = row;

  // 先探查是否有关联数据（只取第一条判断 total），为空时仅提示、不弹窗
  const { list, total } = await fetchRelationUsers({ page: 1, size: 1 });
  if (!total && list.length === 0) {
    window.$notification?.info({ title: $t('common.noData'), duration: 3000 });
    return;
  }

  relationUserVisible.value = true;
}

/** 弹窗取数：角色关联用户（/user/query where.roleIds 数组成员匹配；错误提示由 request 拦截器统一弹出，失败返回空列表） */
async function fetchRelationUsers({ page, size }: { page: number; size: number }) {
  if (!relationRow.value) return { list: [], total: 0 };

  const { data: res, error } = await fetchGetRoleUserList({ page, size, roleId: relationRow.value._id });
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

function handleSubmitted() {
  getData();
}
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
        :action-width="180"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
        <template #name="{ row }">
          <div class="flex-y-center gap-4px">
            <Link type="primary">{{ row.name }}</Link>
            <NTag v-if="row.buildIn === 1" size="small" type="info" :bordered="false">
              {{ $t('page.manage.role.builtIn') }}
            </NTag>
          </div>
        </template>

        <template #roleType="{ row }">
          <NTag size="small" :bordered="false">{{ roleTypeLabel(row.roleType) }}</NTag>
        </template>

        <template #relationUser="{ row }">
          <LButton type="primary" text @click="openRelationModal(row)">
            {{ $t('page.manage.site.view') }}
          </LButton>
        </template>

        <template #dataAuths="{ row }">
          <span>{{ dataAuthLabels(row.dataAuths) }}</span>
        </template>

        <template #createDate="{ row }">
          <span>{{ formatDate(row.createDate) }}</span>
        </template>

        <template #updateDate="{ row }">
          <span>{{ formatDate(row.updateDate) }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <LButton auth="system:role:add" type="primary" @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
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
            <LButton circle @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </LButton>
          </NSpace>
        </template>

        <template #action="{ row }">
          <NTooltip :disabled="row.buildIn !== 1">
            <template #trigger>
              <span>
                <LButton
                  v-auth="'system:role:edit'"
                  type="primary"
                  text
                  :disabled="row.buildIn === 1"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </LButton>
              </span>
            </template>
            {{ $t('page.manage.role.builtInEditTip') }}
          </NTooltip>
          <NTooltip :disabled="row.roleType !== 100">
            <template #trigger>
              <span>
                <LButton
                  v-auth="'system:role:permission'"
                  type="info"
                  text
                  :disabled="row.roleType === 100"
                  @click="openPermissionDrawer(row)"
                >
                  {{ $t('page.manage.role.permission') }}
                </LButton>
              </span>
            </template>
            {{ $t('page.manage.role.permissionDisabledTip') }}
          </NTooltip>
          <NTooltip :disabled="row.buildIn !== 1">
            <template #trigger>
              <span>
                <LButton
                  v-auth="'system:role:delete'"
                  type="error"
                  text
                  :disabled="row.buildIn === 1"
                  popconfirm
                  @positive-click="handleDelete([row])"
                >
                  {{ $t('common.delete') }}
                </LButton>
              </span>
            </template>
            {{ $t('page.manage.role.builtInDeleteTip') }}
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

    <RoleOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />

    <RolePermissionDrawer v-model:show="permissionVisible" :row="permissionRow" @submitted="handleSubmitted" />

    <RelationModal
      v-model:show="relationUserVisible"
      :title="$t('page.manage.role.relationUser')"
      :fetcher="fetchRelationUsers"
      :columns="relationUserColumns"
    />
  </div>
</template>

<style scoped></style>
