<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { $t } from '@/locales';
import MasterDetail from '../components/MasterDetail.vue';
import Table from '@/components/Table/table.vue';
import TableColumnConfig from '@/components/Table/table-column-config.vue';
import { useVxeTable, type VxeColumnConfig } from '@/components/Table/use-vxe-table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchGetExportTemplateList,
  fetchCreateExportTemplate,
  fetchDeleteExportTemplate
} from '@/service/api/export-format';

/** 固定导出格式类型（业务数据常量，非接口） */
const categories = [
  { id: 1, name: '业务清单导出' },
  { id: 2, name: '收货交接单导出' },
  { id: 3, name: '发运交接单导出' },
  { id: 4, name: '应收账单（按费用）导出' },
  { id: 5, name: '应收账单（按票）导出' },
  { id: 6, name: '应付账单（按费用）导出' },
  { id: 7, name: '应付账单（按票）导出' },
  { id: 8, name: 'AWB 总单清单导出' },
  { id: 9, name: '单票运单导入' },
  { id: 10, name: '报关资料导出' },
  { id: 11, name: '出货清单导出' },
  { id: 12, name: '配合订单详情导出' },
  { id: 13, name: '清关资料导出' }
];

const selectedCategoryId = ref<number>(categories[0].id);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.ExportFormat.List,
  Api.ExportFormat.Template
>({
  api: ({ current, size }) =>
    fetchGetExportTemplateList({
      categoryId: selectedCategoryId.value,
      current,
      size
    }) as Promise<Api.ExportFormat.List>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.exportFormat.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'scope', title: $t('page.manage.setting.exportFormat.scope'), visible: true, sortable: false },
      { key: 'remark', title: $t('page.manage.setting.exportFormat.remark'), visible: true, sortable: false },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.exportFormat.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.exportFormat.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'setting-export-format'
});

const columnConfigVisible = ref(false);
const selectedRows = ref<Api.ExportFormat.Template[]>([]);

function handleCategoryChange(id: number | null) {
  if (id === null) return;
  selectedCategoryId.value = id;
  getData();
}

function handleSelectionChange(rows: Api.ExportFormat.Template[]) {
  selectedRows.value = rows;
}

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const formModel = ref<Api.ExportFormat.CreateParams>({
  categoryId: categories[0].id,
  name: '',
  scope: '内部系统',
  fileName: '',
  remark: ''
});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? $t('page.manage.setting.exportFormat.newTitle')
    : $t('page.manage.setting.exportFormat.editTitle')
);

const scopeOptions = [
  { label: $t('page.manage.setting.exportFormat.scopeInternal'), value: '内部系统' },
  { label: $t('page.manage.setting.exportFormat.scopeCustomer'), value: '客户' },
  { label: $t('page.manage.setting.exportFormat.scopeAll'), value: '全部' }
];

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
    key: 'scope',
    label: $t('page.manage.setting.exportFormat.scope'),
    type: 'select',
    span: 24,
    options: scopeOptions
  },
  {
    key: 'fileName',
    label: $t('page.manage.setting.exportFormat.fileName'),
    type: 'custom',
    span: 24
  },
  { key: 'remark', label: $t('page.manage.setting.exportFormat.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = {
    categoryId: selectedCategoryId.value,
    name: '',
    scope: '内部系统',
    fileName: '',
    remark: ''
  };
  drawerVisible.value = true;
}
function openEdit(row: Api.ExportFormat.Template) {
  drawerMode.value = 'edit';
  formModel.value = { ...row };
  drawerVisible.value = true;
}

function handleUploadChange({ file }: { file: UploadFileInfo }) {
  formModel.value.fileName = file.name ?? '';
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  await fetchCreateExportTemplate(formModel.value);
  drawerVisible.value = false;
  getData();
  window.$message?.success($t('common.saveSuccess'));
}

function handleDelete() {
  if (!selectedRows.value.length) return;
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await fetchDeleteExportTemplate(selectedRows.value.map(r => r.id));
      selectedRows.value = [];
      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

function handleDownloadTemplate() {
  window.$message?.info($t('page.manage.setting.exportFormat.downloadToast'));
}

function handleDownloadFields() {
  window.$message?.info($t('page.manage.setting.exportFormat.downloadFieldsToast'));
}
</script>

<template>
  <MasterDetail
    :list-title="$t('page.manage.setting.exportFormat.listTitle')"
    :items="categories"
    :show-status="false"
    :show-actions="false"
    :show-search="false"
    :selected-id="selectedCategoryId"
    @update:selected-id="handleCategoryChange"
  >
    <div class="h-full w-full flex flex-col min-h-0">
      <div class="mb-8px shrink-0 text-12px text-gray-400">
        {{ $t('page.manage.setting.exportFormat.hint') }}
      </div>
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        show-checkbox
        show-action
        :action-width="160"
        action-align="left"
        @refresh="getData"
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NButton type="primary" ghost size="small" @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('page.manage.setting.exportFormat.create') }}
          </NButton>
          <NButton type="error" ghost size="small" :disabled="!selectedRows.length" @click="handleDelete">
            <template #icon><icon-ic-round-delete class="text-icon" /></template>
            {{ $t('page.manage.setting.exportFormat.delete') }}
          </NButton>
          <NButton size="small" @click="handleDownloadFields">
            <template #icon><icon-ic-round-download class="text-icon" /></template>
            {{ $t('page.manage.setting.exportFormat.downloadFields') }}
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
          />
        </template>
        <template #action="{ row }">
          <NButton text type="primary" @click="openEdit(row)">
            {{ $t('page.manage.setting.exportFormat.edit') }}
          </NButton>
          <NButton text type="primary" @click="handleDownloadTemplate">
            {{ $t('page.manage.setting.exportFormat.download') }}
          </NButton>
        </template>
      </Table>
    </div>

    <Drawer v-model:show="drawerVisible" :title="drawerTitle" :footer="true" @submit="handleDrawerSubmit">
      <NFormWrap ref="formRef" :model="formModel" :items="formItems">
        <template #fileName>
          <div class="flex flex-col gap-4px">
            <NUpload :default-upload="false" :max="1" @change="handleUploadChange">
              <NButton size="small">{{ $t('common.excelTemplate') }}</NButton>
            </NUpload>
            <!--            <span v-if="formModel.fileName" class="text-12px text-gray-500">{{ formModel.fileName }}</span>-->
          </div>
        </template>
      </NFormWrap>
    </Drawer>
  </MasterDetail>
</template>
