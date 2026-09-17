<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCopyPrintTemplate,
  fetchCreatePrintTemplate,
  fetchDeletePrintTemplate,
  fetchGetPrintTemplateList,
  fetchUpdatePrintTemplate
} from '@/service/api/print-format';
import { SIZE_TYPE_OPTIONS, sizeTypeLabel } from '@/service/api/print-format/size-map';

/** 模板类型选项（对齐后端 templateType 6 类） */
const templateTypeOptions: { label: string; value: Api.PrintFormat.TemplateType }[] = [
  { label: '收货标签', value: 0 },
  { label: '发货标签', value: 1 },
  { label: '派送标签', value: 2 },
  { label: '发货发票', value: 3 },
  { label: '派送发票', value: 4 },
  { label: '提单标签', value: 5 }
];

/** 模板格式选项（对齐后端 templateMode） */
const templateModeOptions: { label: string; value: Api.PrintFormat.TemplateMode }[] = [
  { label: 'PDF', value: 0 },
  { label: 'Excel', value: 1 }
];

/** 模板类型名（表格列展示用） */
function templateTypeLabel(value: number) {
  return templateTypeOptions.find(item => item.value === value)?.label ?? '';
}

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
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.printFormat.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      {
        key: 'templateType',
        title: $t('page.manage.setting.printFormat.category'),
        visible: true,
        width: 120,
        sortable: false
      },
      { key: 'sizeType', title: $t('page.manage.setting.printFormat.labelSize'), visible: true, sortable: false },
      {
        key: 'isDefault',
        title: $t('page.manage.setting.printFormat.isDefault'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'generate',
        title: $t('page.manage.setting.printFormat.generatedCount'),
        visible: true,
        width: 120,
        align: 'center',
        sortable: false
      },
      { key: 'note', title: $t('page.manage.setting.printFormat.remark'), visible: true, sortable: false },
      {
        key: 'updateBy',
        title: $t('page.manage.setting.printFormat.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.manage.setting.printFormat.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
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

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'view' | 'copy'>('create');
/** 复制源模板 id（复制模式提交时使用） */
const copySourceId = ref('');
const formModel = ref<Api.PrintFormat.SaveParams>({
  name: '',
  templateType: 0,
  templateMode: 0,
  sizeType: 2,
  isDefault: 0,
  note: ''
});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? $t('page.manage.setting.printFormat.newTitle')
    : drawerMode.value === 'copy'
      ? $t('page.manage.setting.printFormat.copyTitle')
      : $t('page.manage.setting.printFormat.detailTitle')
);

const formItems = computed<FormItemConfig[]>(() => {
  const items: FormItemConfig[] = [
    {
      key: 'name',
      label: $t('page.manage.setting.printFormat.name'),
      type: 'input',
      required: true,
      span: 24,
      placeholder: '请输入模板名称'
    },
    {
      key: 'templateType',
      label: $t('page.manage.setting.printFormat.category'),
      type: 'select',
      required: true,
      span: 24,
      options: templateTypeOptions
    },
    {
      key: 'templateMode',
      label: '模板格式',
      type: 'select',
      required: true,
      span: 24,
      options: templateModeOptions
    },
    {
      key: 'sizeType',
      label: $t('page.manage.setting.printFormat.labelSize'),
      type: 'select',
      required: true,
      span: 24,
      options: SIZE_TYPE_OPTIONS
    }
  ];

  // 自定义尺寸时追加宽高输入（mm）
  if (formModel.value.sizeType === 5) {
    items.push(
      { key: 'width', label: '宽度（mm）', type: 'number', required: true, span: 12 },
      { key: 'height', label: '高度（mm）', type: 'number', required: true, span: 12 }
    );
  }

  items.push(
    {
      key: 'isDefault',
      label: $t('page.manage.setting.printFormat.isDefault'),
      type: 'switch',
      span: 24,
      checkedText: $t('page.manage.setting.printFormat.yes'),
      uncheckedText: $t('page.manage.setting.printFormat.no'),
      checkedValue: 1,
      uncheckedValue: 0
    },
    { key: 'note', label: $t('page.manage.setting.printFormat.remark'), type: 'textarea', span: 24 }
  );

  return items;
});

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = {
    name: '',
    templateType: filterTemplateType.value ?? 0,
    templateMode: 0,
    sizeType: 2,
    isDefault: 0,
    note: ''
  };
  drawerVisible.value = true;
}

function openView(row: Api.PrintFormat.Template) {
  drawerMode.value = 'view';
  formModel.value = {
    name: row.name,
    templateType: row.templateType,
    templateMode: row.templateMode,
    sizeType: row.sizeType,
    width: row.width,
    height: row.height,
    isDefault: row.isDefault,
    note: row.note ?? ''
  };
  drawerVisible.value = true;
}

function openCopy(row: Api.PrintFormat.Template) {
  drawerMode.value = 'copy';
  copySourceId.value = row._id;
  // 复制只带基础信息，design 由服务端从原模板复制
  formModel.value = {
    name: row.name,
    templateType: row.templateType,
    templateMode: row.templateMode,
    sizeType: row.sizeType,
    width: row.width,
    height: row.height,
    isDefault: 0,
    note: row.note ?? ''
  };
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  if (drawerMode.value === 'view') {
    drawerVisible.value = false;
    return;
  }
  const ok = await formRef.value?.validate();
  if (!ok) return;

  const params: Api.PrintFormat.SaveParams = { ...formModel.value };
  // 非自定义尺寸时宽高由后端按固定档位回填，无需提交
  if (params.sizeType !== 5) {
    delete params.width;
    delete params.height;
  }

  if (drawerMode.value === 'create') {
    await fetchCreatePrintTemplate(params);
  } else {
    await fetchCopyPrintTemplate({ copyId: copySourceId.value, pdfTemplate: params });
  }
  drawerVisible.value = false;
  getData();
  window.$message?.success($t('common.saveSuccess'));
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
      :action-width="300"
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
            :options="templateTypeOptions"
            placeholder="全部类型"
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
          v-model:visible="configVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton text type="primary" @click="openDesign(row)">
          {{ $t('page.manage.setting.printFormat.design') }}
        </NButton>
        <NButton text type="primary" @click="openView(row)">{{ $t('page.manage.setting.printFormat.view') }}</NButton>
        <NButton text type="primary" @click="openCopy(row)">{{ $t('page.manage.setting.printFormat.copy') }}</NButton>
        <NButton text type="primary" :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
          {{ $t('page.manage.setting.printFormat.setDefault') }}
        </NButton>
        <NButton text type="error" @click="handleDelete(row)">{{ $t('common.delete') }}</NButton>
      </template>
    </Table>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :footer="drawerMode !== 'view'"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" :mode="drawerMode === 'view' ? 'view' : 'edit'" />
    </Drawer>
  </div>
</template>
