<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteInitData, fetchGetInitDataList } from '@/service/api/init-data';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import InitDataFormDrawer from './init-data-form-drawer.vue';

const props = defineProps<{ category: Api.SystemManage.InitDataCategory }>();

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.InitDataList,
  Api.SystemManage.InitDataItem
>({
  api: ({ current, size }) =>
    fetchGetInitDataList({ current, size, category: props.category }) as Promise<Api.SystemManage.InitDataList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'cnName',
        title: $t('page.manage.setting.initData.cnName'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'enName',
        title: $t('page.manage.setting.initData.enName'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      { key: 'remark', title: $t('page.manage.setting.initData.remark'), visible: true, minWidth: 200, sortable: false }
    ] as VxeColumnConfig[],
  cacheKey: `init-data-${props.category}`
});

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.InitDataItem[]>([]);

function handleSelectionChange(records: Api.SystemManage.InitDataItem[]) {
  checkedRows.value = records;
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

async function handleDelete(ids: number[]) {
  await fetchDeleteInitData(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit'>('create');
const operateRow = ref<Api.SystemManage.InitDataItem | null>(null);

function openDrawer(mode: 'create' | 'edit', row?: Api.SystemManage.InitDataItem) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleEdit(row: Api.SystemManage.InitDataItem) {
  openDrawer('edit', row);
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="120"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" ghost @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('page.manage.setting.initData.addRow') }}
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
          <NPopconfirm @positive-click="handleDelete([row.id])">
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

    <InitDataFormDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :category="props.category"
      :row="operateRow"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
