<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import { fetchDeleteExportTemplate, fetchGetExportTemplateList } from '@/service/api/export-format';
import ExportFormatDrawer from './export-format-drawer.vue';
import { buildExportFormatColumns } from './table-columns';
import { getTemplateTypeOptions, templateTypeLabel } from './template-type';

/** 模板类别选项（搜索筛选用；抽屉内取同一份） */
const templateTypeOptions = computed(() => getTemplateTypeOptions());

/** 毫秒时间戳格式化展示（最后更新时间） */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

/** 名称模糊搜索关键字（api 闭包内读取，查询时重置到第一页） */
const keyword = ref('');
/** 类别筛选（null = 全部类别） */
const filterType = ref<number | null>(null);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.ExportFormat.List,
  Api.ExportFormat.Template
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetExportTemplateList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: filterType.value === null ? {} : { templateType: filterType.value }
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // 后端返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  // 列配置见 ./table-columns.ts（列持久化 cacheKey 仍由本页管理）
  columns: () => buildExportFormatColumns(),
  // 列已按后端字段整组调整：列配置缓存以缓存数组为准，升版本避免老缓存把新列挡住
  cacheKey: 'setting-export-format-v3'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  filterType.value = null;
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

/** 下载模板：新窗口打开后端返回的模板文件地址 */
function handleDownload(row: Api.ExportFormat.Template) {
  if (!row.fileUrl) {
    window.$message?.warning($t('page.manage.setting.exportFormat.downloadMissing'));
    return;
  }

  window.open(row.fileUrl, '_blank');
}

/** 删除模板（后端仅支持单条 _id） */
async function confirmDelete(row: Api.ExportFormat.Template) {
  const { error } = await fetchDeleteExportTemplate(row._id);
  if (error) return;

  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

// ---- 抽屉：新增 / 编辑由独立组件承载，页面只维护源行 ----
const drawerVisible = ref(false);
/** 编辑时的行数据（新增时为 null） */
const drawerRow = ref<Api.ExportFormat.Template | null>(null);

function openCreate() {
  drawerRow.value = null;
  drawerVisible.value = true;
}

function openEdit(row: Api.ExportFormat.Template) {
  drawerRow.value = row;
  drawerVisible.value = true;
}
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      show-action
      :action-width="130"
      action-align="left"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <!-- 快速搜索栏：模板名称 + 类别筛选 -->
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            placeholder="请输入模板名称"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="filterType"
            class="w-200px!"
            clearable
            :options="templateTypeOptions"
            placeholder="全部类别"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
      </template>
      <template #templateType="{ row }">
        <span>{{ templateTypeLabel(row.templateType) }}</span>
      </template>
      <template #updateDate="{ row }">
        <span>{{ formatDateTime(row.updateDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NButton size="small" type="primary" text @click="handleDownload(row)">
          {{ $t('page.manage.setting.exportFormat.download') }}
        </NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <ExportFormatDrawer
      v-model:show="drawerVisible"
      :row="drawerRow"
      :default-template-type="filterType ?? 0"
      @submitted="getData"
    />
  </div>
</template>
