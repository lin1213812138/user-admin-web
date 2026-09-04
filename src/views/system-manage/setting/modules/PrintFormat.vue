<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import MasterDetail from '../components/MasterDetail.vue';
import Table from '@/components/Table/table.vue';
import TableColumnConfig from '@/components/Table/table-column-config.vue';
import { useVxeTable, type VxeColumnConfig } from '@/components/Table/use-vxe-table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchGetPrintTemplateList,
  fetchCreatePrintTemplate,
  fetchDeletePrintTemplate,
  fetchCopyPrintTemplate,
  fetchSetDefaultPrintTemplate
} from '@/service/api/print-format';

/** 固定分类（业务数据常量，非接口） */
const categories = [
  { id: 1, name: '内单标签' },
  { id: 2, name: '转单标签' },
  { id: 3, name: '形式发票' },
  { id: 4, name: '总单标签' }
];

const selectedCategoryId = ref<number>(categories[0].id);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.PrintFormat.List,
  Api.PrintFormat.Template
>({
  api: ({ current, size }) =>
    fetchGetPrintTemplateList({ categoryId: selectedCategoryId.value, current, size }) as Promise<Api.PrintFormat.List>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.printFormat.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'labelSize', title: $t('page.manage.setting.printFormat.labelSize'), visible: true, sortable: false },
      {
        key: 'isDefault',
        title: $t('page.manage.setting.printFormat.isDefault'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'generatedCount',
        title: $t('page.manage.setting.printFormat.generatedCount'),
        visible: true,
        width: 120,
        align: 'center',
        sortable: false
      },
      { key: 'remark', title: $t('page.manage.setting.printFormat.remark'), visible: true, sortable: false },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.printFormat.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.printFormat.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'setting-print-format'
});

const columnConfigVisible = ref(false);
const selectedRows = ref<Api.PrintFormat.Template[]>([]);

function handleCategoryChange(id: number | null) {
  if (id === null) return;
  selectedCategoryId.value = id;
  getData();
}

function handleSelectionChange(rows: Api.PrintFormat.Template[]) {
  selectedRows.value = rows;
}

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'view' | 'copy'>('create');
const formModel = ref<Api.PrintFormat.CreateParams>({
  categoryId: categories[0].id,
  name: '',
  labelSize: '100×150mm',
  isDefault: 0,
  remark: ''
});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? $t('page.manage.setting.printFormat.newTitle')
    : drawerMode.value === 'copy'
      ? $t('page.manage.setting.printFormat.copyTitle')
      : $t('page.manage.setting.printFormat.detailTitle')
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.printFormat.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: '请输入模板名称'
  },
  {
    key: 'labelSize',
    label: $t('page.manage.setting.printFormat.labelSize'),
    type: 'select',
    span: 24,
    options: [
      { label: '100×150mm', value: '100×150mm' },
      { label: '80×60mm', value: '80×60mm' },
      { label: 'A4', value: 'A4' },
      { label: '100×100mm', value: '100×100mm' },
      { label: '自定义', value: '自定义' }
    ]
  },
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
  { key: 'remark', label: $t('page.manage.setting.printFormat.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = {
    categoryId: selectedCategoryId.value,
    name: '',
    labelSize: '100×150mm',
    isDefault: 0,
    remark: ''
  };
  drawerVisible.value = true;
}
function openView(row: Api.PrintFormat.Template) {
  drawerMode.value = 'view';
  formModel.value = { ...row };
  drawerVisible.value = true;
}
function openCopy(row: Api.PrintFormat.Template) {
  drawerMode.value = 'copy';
  formModel.value = { ...row, isDefault: 0 };
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  if (drawerMode.value === 'view') {
    drawerVisible.value = false;
    return;
  }
  const ok = await formRef.value?.validate();
  if (!ok) return;
  if (drawerMode.value === 'create') {
    await fetchCreatePrintTemplate(formModel.value);
  } else {
    await fetchCopyPrintTemplate(formModel.value);
  }
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
      await fetchDeletePrintTemplate(selectedRows.value.map(r => r.id));
      selectedRows.value = [];
      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSetDefault(row: Api.PrintFormat.Template) {
  await fetchSetDefaultPrintTemplate({ id: row.id, categoryId: row.categoryId });
  getData();
  window.$message?.success($t('common.saveSuccess'));
}
</script>

<template>
  <MasterDetail
    :list-title="$t('page.manage.setting.printFormat.listTitle')"
    :items="categories"
    :show-status="false"
    :show-actions="false"
    :show-search="false"
    :selected-id="selectedCategoryId"
    @update:selected-id="handleCategoryChange"
  >
    <div class="h-full w-full flex flex-col min-h-0">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        show-checkbox
        show-action
        :action-width="200"
        action-align="left"
        @refresh="getData"
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NButton type="primary" ghost size="small" @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('page.manage.setting.printFormat.create') }}
          </NButton>
          <NButton type="error" ghost size="small" :disabled="!selectedRows.length" @click="handleDelete">
            <template #icon><icon-ic-round-delete class="text-icon" /></template>
            {{ $t('page.manage.setting.printFormat.delete') }}
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
        <template #isDefault="{ row }">
          <NTag v-if="row.isDefault === 1" size="small" type="success">
            {{ $t('page.manage.setting.printFormat.yes') }}
          </NTag>
          <NTag v-else size="small" type="default">{{ $t('page.manage.setting.printFormat.no') }}</NTag>
        </template>
        <template #action="{ row }">
          <NButton text type="primary" @click="openView(row)">{{ $t('page.manage.setting.printFormat.view') }}</NButton>
          <NButton text type="primary" @click="openCopy(row)">{{ $t('page.manage.setting.printFormat.copy') }}</NButton>
          <NButton text type="primary" :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
            {{ $t('page.manage.setting.printFormat.setDefault') }}
          </NButton>
        </template>
      </Table>
    </div>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :footer="drawerMode !== 'view'"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" :disabled="drawerMode === 'view'" />
    </Drawer>
  </MasterDetail>
</template>
