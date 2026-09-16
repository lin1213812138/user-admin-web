<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteGroup, fetchGetGroupList } from '@/service/api/group';
import { fetchGetSiteList } from '@/service/api/site';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
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
      { key: 'desc', title: $t('page.manage.group.remark'), visible: true, minWidth: 160, sortable: false },
      { key: 'creator', title: $t('page.manage.group.creator'), visible: true, width: 100, sortable: false },
      { key: 'createDate', title: $t('page.manage.group.createTime'), visible: true, width: 180, sortable: false },
      { key: 'updateBy', title: $t('page.manage.group.updateBy'), visible: true, width: 100, sortable: false },
      { key: 'updateDate', title: $t('page.manage.group.updateTime'), visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  // 字段结构对齐后端（name/desc/_id），换新缓存 key 避免旧列配置（groupName/status 等）残留
  cacheKey: 'system-manage-group-v2'
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

function handleDetail(row: Api.SystemManage.Group) {
  openDrawer('detail', row);
}

function handleEdit(row: Api.SystemManage.Group) {
  openDrawer('edit', row);
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
        :action-width="120"
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
  </div>
</template>

<style scoped></style>
