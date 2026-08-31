<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { fetchGetUserList } from '@/service/api/system-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import UserOperateDrawer from './modules/user-operate-drawer.vue';

interface UserItem {
  id: number;
  userName: string;
  nickName: string;
  userPhone: string;
  userEmail: string;
  status: Api.Common.EnableStatus;
  createTime: string;
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.SystemManage.UserList,
  UserItem
>({
  api: ({ current, size }) => fetchGetUserList({ current, size }) as Promise<Api.SystemManage.UserList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'userName', title: $t('page.manage.user.userName'), type: 'detail', visible: true, sortable: false },
      { key: 'nickName', title: $t('page.manage.user.nickName'), visible: true, sortable: false },
      { key: 'userPhone', title: $t('page.manage.user.userPhone'), visible: true, sortable: false },
      { key: 'userEmail', title: $t('page.manage.user.userEmail'), visible: true, sortable: false },
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
      { key: 'createTime', title: $t('page.manage.user.createTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-user'
});

const configVisible = ref(false);
const checkedRows = ref<UserItem[]>([]);

function handleSelectionChange(records: UserItem[]) {
  checkedRows.value = records;
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

function handleEdit(row: UserItem) {
  openDrawer('edit', row);
}

function handleDelete(row: UserItem) {
  data.value = data.value.filter(item => item.id !== row.id);
  pagination.total = Math.max(0, pagination.total - 1);
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.User | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: UserItem) {
  operateMode.value = mode;
  operateRow.value = (row as Api.SystemManage.User) ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.User) {
  openDrawer('detail', row);
}

function handleCreated() {
  getData();
}
</script>

<template>
  <div class="h-full w-full p-16px">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-checkbox="true"
      :show-action="true"
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
          <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
            <template #icon>
              <icon-mdi-delete class="text-icon" />
            </template>
            {{ $t('common.batchDelete') }}
          </NButton>
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
            <!-- {{ $t('common.refresh') }} -->
          </NButton>
        </NSpace>
      </template>

      <template #action="{ row }">
        <NSpace justify="center">
          <NButton size="small" type="primary" text @click="handleEdit(row)">
            {{ $t('common.edit') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Table>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />

    <UserOperateDrawer v-model:show="operateVisible" :mode="operateMode" :row="operateRow" @submitted="handleCreated" />
  </div>
</template>

<style scoped></style>
