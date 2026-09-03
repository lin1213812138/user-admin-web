<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteRole, fetchGetRoleList } from '@/service/api/system-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';
import RolePermissionDrawer from './modules/role-permission-drawer.vue';

const searchParams = reactive<Omit<Api.SystemManage.RoleSearchParams, 'current' | 'size'>>({
  roleName: '',
  roleCode: '',
  status: null
});

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: '1' },
  { label: $t('common.disable'), value: '2' }
]);

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'roleName',
    label: $t('page.manage.role.roleName'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.role.form.roleNamePlaceholder')
  },
  {
    key: 'roleCode',
    label: $t('page.manage.role.roleCode'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.role.form.roleCodePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.role.status'),
    type: 'select',
    span: 6,
    options: statusOptions.value,
    placeholder: $t('page.manage.role.form.statusPlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.SystemManage.RoleList,
  Api.SystemManage.Role
>({
  api: ({ current, size }) =>
    fetchGetRoleList({
      current,
      size,
      roleName: searchParams.roleName?.trim() || undefined,
      roleCode: searchParams.roleCode?.trim() || undefined,
      status: searchParams.status || undefined
    }) as Promise<Api.SystemManage.RoleList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'roleName', title: $t('page.manage.role.roleName'), type: 'detail', visible: true, sortable: false },
      { key: 'roleCode', title: $t('page.manage.role.roleCode'), visible: true, sortable: false },
      { key: 'remark', title: $t('page.manage.role.remark'), visible: true, minWidth: 200, sortable: false },
      { key: 'sort', title: $t('page.manage.role.sort'), visible: true, width: 80, align: 'center', sortable: true },
      {
        key: 'status',
        title: $t('page.manage.role.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        sortable: false,
        align: 'center'
      },
      { key: 'createTime', title: $t('page.manage.role.createTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-role'
});

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
  searchParams.roleName = '';
  searchParams.roleCode = '';
  searchParams.status = null;
  handleSearch();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteRole(ids);
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
              @positive-click="handleDelete(checkedRows.map(i => i.id))"
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
          <NButton size="small" type="info" text @click="openPermissionDrawer(row)">
            {{ $t('page.manage.role.permission') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>
    </div>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />

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
