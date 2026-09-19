<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import {
  fetchDeletePrintTemplate,
  fetchGetPrintTemplateList,
  fetchUpdatePrintTemplate
} from '@/service/api/print-format';
import { sizeTypeLabel } from '@/service/api/print-format/size-map';
import PrintFormatDrawer from './print-format-drawer.vue';
import { buildPrintFormatColumns } from './table-columns';
import { TEMPLATE_TYPE_OPTIONS, templateTypeLabel } from './template-type';

/** 编辑时间（毫秒时间戳 → 展示文案） */
function formatDateTime(ms?: number) {
  return ms ? dayjs(ms).format('YYYY-MM-DD HH:mm') : '';
}

/** 名称模糊搜索关键字（api 闭包内读取，查询时重置到第一页） */
const keyword = ref('');
/** 模板类型筛选（null = 全部类型） */
const filterTemplateType = ref<Api.PrintFormat.TemplateType | null>(null);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.PrintFormat.List,
  Api.PrintFormat.Template
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetPrintTemplateList({
      page: current,
      size,
      keyword: keyword.value.trim() || undefined,
      where: filterTemplateType.value != null ? { templateType: filterTemplateType.value } : undefined
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // wms-user 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  // 列配置见 ./table-columns.ts（列持久化 cacheKey 仍由本页管理）
  columns: () => buildPrintFormatColumns(),
  cacheKey: 'setting-print-format-v3'
});

const configVisible = ref(false);

const { routerPushByKey } = useRouterPush();

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  filterTemplateType.value = null;
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

/** 跳转到自研标签设计器（设计器按 query.id 拉取模板详情，name 仅用于加载完成前的标题展示） */
function openDesign(row: Api.PrintFormat.Template) {
  void routerPushByKey('system-manage_label-designer', {
    query: { id: row._id, name: row.name }
  });
}

// ---- 抽屉：新增 / 复制 / 查看由独立组件承载，页面只维护模式与源行 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'copy' | 'view'>('create');
/** 复制 / 查看的源模板行（新增时为 null） */
const drawerRow = ref<Api.PrintFormat.Template | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}

function openCopy(row: Api.PrintFormat.Template) {
  drawerMode.value = 'copy';
  drawerRow.value = row;
  drawerVisible.value = true;
}

/** 设为默认：后端无独立接口，走 update（isDefault=1 时服务端把同类型的其他记录清 0） */
async function handleSetDefault(row: Api.PrintFormat.Template) {
  await fetchUpdatePrintTemplate({
    _id: row._id,
    name: row.name,
    templateType: row.templateType,
    templateMode: row.templateMode,
    sizeType: row.sizeType,
    width: row.width,
    height: row.height,
    isDefault: 1,
    note: row.note
  });
  getData();
  window.$message?.success($t('common.saveSuccess'));
}

function handleDelete(row: Api.PrintFormat.Template) {
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await fetchDeletePrintTemplate(row._id);
      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
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
      :action-width="200"
      action-align="left"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <!-- 快速搜索栏：模板名称 + 模板类型筛选 -->
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
            v-model:value="filterTemplateType"
            class="w-180px!"
            clearable
            :options="TEMPLATE_TYPE_OPTIONS"
            placeholder="全部类型"
          />
          <LButton type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </LButton>
          <LButton @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </LButton>
        </div>
      </template>
      <template #templateType="{ row }">
        <span>{{ templateTypeLabel(row.templateType) }}</span>
      </template>
      <template #sizeType="{ row }">
        <span>{{ sizeTypeLabel(row.sizeType, row.width, row.height) }}</span>
      </template>
      <template #isDefault="{ row }">
        <NTag v-if="row.isDefault === 1" size="small" type="success">
          {{ $t('page.manage.setting.printFormat.yes') }}
        </NTag>
        <NTag v-else size="small" type="default">{{ $t('page.manage.setting.printFormat.no') }}</NTag>
      </template>
      <template #generate="{ row }">
        <span>
          {{
            row.generate === 1 ? $t('page.manage.setting.printFormat.yes') : $t('page.manage.setting.printFormat.no')
          }}
        </span>
      </template>
      <template #updateDate="{ row }">
        <span>{{ formatDateTime(row.updateDate) }}</span>
      </template>
      <template #operation-left>
        <LButton type="primary" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </LButton>
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
        <TableColumnConfig
          v-model:visible="configVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <LButton text type="primary" @click="openDesign(row)">
          {{ $t('page.manage.setting.printFormat.design') }}
        </LButton>
        <LButton text type="primary" @click="openCopy(row)">{{ $t('page.manage.setting.printFormat.copy') }}</LButton>
        <LButton text type="primary" :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
          {{ $t('page.manage.setting.printFormat.setDefault') }}
        </LButton>
        <LButton text popconfirm type="error" @positive-click="handleDelete(row)">{{ $t('common.delete') }}</LButton>
      </template>
    </Table>

    <PrintFormatDrawer
      v-model:show="drawerVisible"
      :mode="drawerMode"
      :row="drawerRow"
      :default-template-type="filterTemplateType ?? 0"
      @submitted="getData"
    />
  </div>
</template>
