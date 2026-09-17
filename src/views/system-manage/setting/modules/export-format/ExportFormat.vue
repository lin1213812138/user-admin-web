<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateExportTemplate,
  fetchDeleteExportTemplate,
  fetchGetExportTemplateList,
  fetchUpdateExportTemplate
} from '@/service/api/export-format';
import ExportTemplateUpload from './ExportTemplateUpload.vue';

/** 模板类别（后端固定枚举 0~8，文案走 i18n） */
const templateTypeOptions = computed(() => [
  { label: $t('page.manage.setting.exportFormat.type.sysList'), value: 0 },
  { label: $t('page.manage.setting.exportFormat.type.sendList'), value: 1 },
  { label: $t('page.manage.setting.exportFormat.type.billRec'), value: 2 },
  { label: $t('page.manage.setting.exportFormat.type.billPay'), value: 3 },
  { label: $t('page.manage.setting.exportFormat.type.blLoadList'), value: 4 },
  { label: $t('page.manage.setting.exportFormat.type.blInvoice'), value: 5 },
  { label: $t('page.manage.setting.exportFormat.type.blFile'), value: 6 },
  { label: $t('page.manage.setting.exportFormat.type.blCustoms'), value: 7 },
  { label: $t('page.manage.setting.exportFormat.type.shipOrder'), value: 8 }
]);

/** 类别名（表格列展示用） */
function templateTypeLabel(type?: number) {
  return templateTypeOptions.value.find(item => item.value === type)?.label ?? '';
}

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
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.exportFormat.name'),
        type: 'detail',
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'templateType',
        title: $t('page.manage.setting.exportFormat.templateType'),
        visible: true,
        width: 140,
        sortable: false
      },
      {
        key: 'thPos',
        title: $t('page.manage.setting.exportFormat.thPos'),
        visible: true,
        width: 150,
        sortable: false
      },
      {
        key: 'tdPos',
        title: $t('page.manage.setting.exportFormat.tdPos'),
        visible: true,
        width: 150,
        sortable: false
      },
      {
        key: 'note',
        title: $t('page.manage.setting.exportFormat.note'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'updateBy',
        title: $t('page.manage.setting.exportFormat.lastOperation'),
        visible: true,
        width: 120,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.manage.setting.exportFormat.lastUpdateTime'),
        visible: true,
        width: 170,
        fixed: 'right',
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
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

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
/** 上传解析出的字段清单；未重新上传时保持 null ⇒ 提交体不含这些字段 ⇒ 后端不覆盖库中既有值 */
const parsedFields = ref<Api.ExportFormat.ParsedFields | null>(null);

function emptyForm(): Api.ExportFormat.SaveParams {
  return {
    name: '',
    templateType: filterType.value ?? 0,
    file: '',
    fileUrl: '',
    thPos: '',
    tdPos: '',
    note: ''
  };
}

const formModel = ref<Api.ExportFormat.SaveParams>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? $t('page.manage.setting.exportFormat.newTitle')
    : $t('page.manage.setting.exportFormat.editTitle')
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.exportFormat.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: '请输入模板名称'
  },
  {
    key: 'templateType',
    label: $t('page.manage.setting.exportFormat.templateType'),
    type: 'select',
    required: true,
    span: 24,
    options: templateTypeOptions.value,
    filterable: false
  },
  {
    key: 'file',
    label: $t('page.manage.setting.exportFormat.excelTemplate'),
    type: 'custom',
    required: true,
    requiredMsg: $t('page.manage.setting.exportFormat.excelTemplateRequired'),
    span: 24
  },
  {
    key: 'thPos',
    label: $t('page.manage.setting.exportFormat.thPos'),
    type: 'input',
    span: 24,
    placeholder: '请输入(字母+数字,如A1)'
  },
  {
    key: 'tdPos',
    label: $t('page.manage.setting.exportFormat.tdPos'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: '请输入(字母+数字,如B1)'
  },
  {
    key: 'note',
    label: $t('page.manage.setting.exportFormat.note'),
    type: 'textarea',
    span: 24,
    placeholder: '请输入'
  }
]);

function openCreate() {
  drawerMode.value = 'create';
  parsedFields.value = null;
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

/** 编辑：以列表行数据回填（query 未 omit 这 6 个字段，无需额外 /get） */
function openEdit(row: Api.ExportFormat.Template) {
  drawerMode.value = 'edit';
  parsedFields.value = null;
  formModel.value = {
    _id: row._id,
    name: row.name,
    templateType: row.templateType,
    file: row.file,
    fileUrl: row.fileUrl,
    thPos: row.thPos ?? '',
    tdPos: row.tdPos ?? '',
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

/** 上传解析成功：暂存字段清单，随保存一起提交 */
function handleParsed(result: Api.ExportFormat.UploadResult) {
  parsedFields.value = {
    fieldRow: result.fieldRow,
    infoList: result.infoList,
    fieldList: result.fieldList,
    subFieldList: result.subFieldList,
    subList: result.subList,
    barcodeList: result.barcodeList,
    subBarcodeList: result.subBarcodeList
  };
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    // 未重新上传时 parsedFields 为 null：提交体不含字段清单，后端保持库中原值
    const extraFields = parsedFields.value ?? {};
    const payload: Api.ExportFormat.SaveParams = { ...formModel.value, ...extraFields };
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateExportTemplate(payload)
        : await fetchUpdateExportTemplate(payload);

    if (error) return;

    drawerVisible.value = false;
    getData();
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
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
      :action-width="180"
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

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :confirm-text="$t('common.save')"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems">
        <template #file>
          <ExportTemplateUpload
            v-model:file="formModel.file"
            @update:file-url="formModel.fileUrl = $event"
            @parsed="handleParsed"
          />
        </template>
      </NFormWrap>
    </Drawer>
  </div>
</template>
