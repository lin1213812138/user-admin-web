<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateBlUnit, fetchUpdateBlUnit } from '@/service/api/data-manage-bl';

type BlUnit = Api.DataManageBl.BlUnit;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BlUnit>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BlUnit> {
  return {
    name: '',
    length: undefined,
    width: undefined,
    height: undefined,
    maxCbm: undefined,
    maxKg: undefined,
    maxLen: undefined,
    status: 1,
    note: ''
  };
}

const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blUnit.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.bl.blUnit.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.blUnit.form.namePlaceholder')
  },
  { key: 'length', label: '长度', type: 'number', span: 12 },
  { key: 'width', label: '宽度', type: 'number', span: 12 },
  { key: 'height', label: '高度', type: 'number', span: 12 },
  { key: 'maxCbm', label: '最大体积(CBM)', type: 'number', span: 12 },
  { key: 'maxKg', label: '最大重量(KG)', type: 'number', span: 12 },
  { key: 'maxLen', label: '最大长度', type: 'number', span: 12 },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    span: 24,
    optionsKey: 'status',
    filterable: false
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: BlUnit) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    length: row.length,
    width: row.width,
    height: row.height,
    maxCbm: row.maxCbm,
    maxKg: row.maxKg,
    maxLen: row.maxLen,
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
        ? await fetchCreateBlUnit(formModel.value)
        : await fetchUpdateBlUnit(formModel.value);

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
