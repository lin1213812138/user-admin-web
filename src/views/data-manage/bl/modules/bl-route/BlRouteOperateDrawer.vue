<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateBlRoute, fetchUpdateBlRoute } from '@/service/api/data-manage-bl';

type BlRoute = Api.DataManageBl.BlRoute;

/** 航线类型（后端固定枚举 0-空运 1-海运） */
const routeTypeOptions = computed(() => [
  { label: $t('page.dataManage.bl.blRoute.routeTypeOption.air'), value: 0 },
  { label: $t('page.dataManage.bl.blRoute.routeTypeOption.sea'), value: 1 }
]);

const statusOptions = computed(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BlRoute>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BlRoute> {
  return { code: '', nameCn: '', nameEn: '', routeType: 1, order: 0, status: 1, note: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.bl.blRoute.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.bl.blRoute.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'routeType',
    label: $t('page.dataManage.bl.blRoute.routeType'),
    type: 'select',
    required: true,
    span: 24,
    options: routeTypeOptions.value,
    filterable: false
  },
  {
    key: 'code',
    label: $t('page.dataManage.bl.blRoute.code'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.blRoute.form.codePlaceholder')
  },
  {
    key: 'nameCn',
    label: $t('page.dataManage.bl.blRoute.nameCn'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.blRoute.form.namePlaceholder')
  },
  { key: 'nameEn', label: $t('page.dataManage.bl.blRoute.nameEn'), type: 'input', span: 24 },
  {
    key: 'order',
    label: $t('page.dataManage.bl.blRoute.order'),
    type: 'number',
    span: 24
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    required: true,
    span: 24,
    options: statusOptions.value
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: BlRoute) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    nameCn: row.nameCn,
    nameEn: row.nameEn,
    routeType: row.routeType,
    order: row.order ?? 0,
    status: row.status ?? 1,
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateBlRoute(formModel.value)
        : await fetchUpdateBlRoute(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="drawerTitle"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
