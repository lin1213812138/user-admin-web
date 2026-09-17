<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteRole, fetchGetRoleList } from '@/service/api/role';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';
import RolePermissionDrawer from './modules/role-permission-drawer.vue';

const searchParams = reactive<{ name: string; roleType: Api.SystemManage.RoleType | null }>({
  name: '',
  roleType: null
});

/** 角色类型下拉选项（后端 RoleType：0-客服 1-销售 2-操作 3-财务 4-经理 5-管理员） */
const roleTypeOptions = computed<CommonType.Option<Api.SystemManage.RoleType>[]>(() => [
  { label: $t('page.manage.role.roleTypes.service'), value: 0 },
  { label: $t('page.manage.role.roleTypes.sales'), value: 1 },
  { label: $t('page.manage.role.roleTypes.operation'), value: 2 },
  { label: $t('page.manage.role.roleTypes.finance'), value: 3 },
  { label: $t('page.manage.role.roleTypes.manager'), value: 4 },
  { label: $t('page.manage.role.roleTypes.admin'), value: 5 }
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
        type: 'detail',
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
      { key: 'desc', title: $t('page.manage.role.desc'), visible: true, minWidth: 160, sortable: false },
      { key: 'order', title: $t('page.manage.role.order'), visible: true, width: 80, align: 'center', sortable: true },
      { key: 'dataAuths', title: $t('page.manage.role.dataAuths'), visible: true, minWidth: 180, sortable: false },
      { key: 'creator', title: $t('page.manage.role.creator'), visible: true, width: 100, sortable: false },
      { key: 'createDate', title: $t('page.manage.role.createTime'), visible: true, width: 180, sortable: false },
      { key: 'updateBy', title: $t('page.manage.role.updateBy'), visible: true, width: 100, sortable: false },
      { key: 'updateDate', title: $t('page.manage.role.updateTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  // 字段结构对齐后端（name/desc/_id），换新缓存 key 避免旧列配置（roleName/status 等）残留
  cacheKey: 'system-manage-role-v2'
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
    5: $t('page.manage.role.roleTypes.admin')
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

async function handleDelete(ids: string[]) {
  // 后端 /role/delete 为单条删除，批量时逐条调用
  await Promise.all(ids.map(id => fetchDeleteRole(id)));
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

function handleDetail(row: Api.SystemManage.Role) {
  openDrawer('detail', row);
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

function handleSubmitted() {
  getData();
}
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
        :action-width="180"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
        <template #roleType="{ row }">
          <NTag size="small" :bordered="false">{{ roleTypeLabel(row.roleType) }}</NTag>
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
          <NTooltip :disabled="row.roleType !== 5">
            <template #trigger>
              <span>
                <NButton
                  size="small"
                  type="info"
                  text
                  :disabled="row.roleType === 5"
                  @click="openPermissionDrawer(row)"
                >
                  {{ $t('page.manage.role.permission') }}
                </NButton>
              </span>
            </template>
            {{ $t('page.manage.role.permissionDisabledTip') }}
          </NTooltip>
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

    <RoleOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />

    <RolePermissionDrawer v-model:show="permissionVisible" :row="permissionRow" @submitted="handleSubmitted" />
  </div>
</template>

<style scoped></style>
