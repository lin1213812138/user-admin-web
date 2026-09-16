<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchDeleteSite, fetchGetSiteList } from '@/service/api/system-manage';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import SiteOperateDrawer from './modules/site-operate-drawer.vue';

const searchParams = reactive<{ keyword: string }>({
  keyword: ''
});

const searchItems = computed<FormItemConfig[]>(() => [
  {
    key: 'keyword',
    label: $t('page.manage.site.keyword'),
    type: 'input',
    span: 6,
    placeholder: $t('page.manage.site.form.keywordPlaceholder')
  },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
]);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.SiteList,
  Api.SystemManage.Site
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetSiteList({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // wms-user 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.manage.site.code'),
        type: 'detail',
        visible: true,
        width: 120,
        sortable: false
      },
      { key: 'name', title: $t('page.manage.site.name'), visible: true, width: 120, sortable: false },
      { key: 'concat', title: $t('page.manage.site.concat'), visible: true, width: 100, sortable: false },
      { key: 'phone', title: $t('page.manage.site.phone'), visible: true, width: 140, sortable: false },
      { key: 'workTime', title: $t('page.manage.site.workTime'), visible: true, minWidth: 180, sortable: false },
      { key: 'startPlace', title: $t('page.manage.site.startPlace'), visible: true, width: 120, sortable: false },
      {
        key: 'address',
        title: $t('page.manage.site.address'),
        visible: true,
        minWidth: 240,
        sortable: false
      },
      { key: 'note', title: $t('page.manage.site.note'), visible: false, minWidth: 160, sortable: false },
      {
        key: 'siteType',
        title: $t('page.manage.site.siteType'),
        visible: true,
        width: 100,
        sortable: false,
        align: 'center'
      },
      { key: 'updateDate', title: $t('page.manage.site.updateDate'), visible: true, width: 200, sortable: true }
    ] as VxeColumnConfig[],
  // 字段结构较旧版变化大，换新缓存 key 避免旧列配置（siteCode/status 等）残留
  cacheKey: 'system-manage-site-v2'
});

/** 毫秒时间戳格式化展示 */
function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
}

/** 总公司（siteType=1）不允许编辑和删除 */
function isHeadquarters(row: Api.SystemManage.Site) {
  return row.siteType === 1;
}

const configVisible = ref(false);
const checkedRows = ref<Api.SystemManage.Site[]>([]);

/** 批量删除仅含可删行（总公司被自动过滤） */
// const deletableRows = computed(() => checkedRows.value.filter(i => !isHeadquarters(i)));

function handleSelectionChange(records: Api.SystemManage.Site[]) {
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
  handleSearch();
}

async function handleDelete(ids: string[]) {
  await fetchDeleteSite(ids);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRows.value = [];
  getData();
}

const operateVisible = ref(false);
const operateMode = ref<'create' | 'edit' | 'detail'>('create');
const operateRow = ref<Api.SystemManage.Site | null>(null);

function openDrawer(mode: 'create' | 'edit' | 'detail', row?: Api.SystemManage.Site) {
  operateMode.value = mode;
  operateRow.value = row ?? null;
  operateVisible.value = true;
}

function handleDetail(row: Api.SystemManage.Site) {
  openDrawer('detail', row);
}

function handleEdit(row: Api.SystemManage.Site) {
  openDrawer('edit', row);
}

function handleSubmitted() {
  getData();
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-16px bg-#eff0f5">
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
        <!-- 快速搜索栏 -->
        <template #search-action>
          <div class="flex justify-start">
            <NInput v-model="searchParams.keyword" class="w-300px!" placeholder="关键词搜索"></NInput>
          </div>
        </template>
        <template #siteType="{ row }">
          <NTag size="small" :type="row.siteType === 1 ? 'info' : 'default'">
            {{
              row.siteType === 1 ? $t('page.manage.site.siteTypeHeadquarters') : $t('page.manage.site.siteTypeBranch')
            }}
          </NTag>
        </template>

        <template #updateDate="{ row }">
          <span>{{ formatDate(row.updateDate) }}</span>
        </template>

        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" @click="openDrawer('create')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
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
            </NButton>
          </NSpace>
        </template>

        <template #action="{ row }">
          <NButton size="small" type="primary" text :disabled="isHeadquarters(row)" @click="handleEdit(row)">
            {{ $t('common.edit') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete([row._id])">
            <template #trigger>
              <NButton size="small" type="error" text :disabled="isHeadquarters(row)">
                {{ $t('common.delete') }}
              </NButton>
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

    <SiteOperateDrawer
      v-model:show="operateVisible"
      :mode="operateMode"
      :row="operateRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped></style>
