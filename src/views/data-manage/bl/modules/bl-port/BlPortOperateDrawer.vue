<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateBlPort, fetchUpdateBlPort } from '@/service/api/data-manage-bl';

type BlPort = Api.DataManageBl.BlPort;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BlPort>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BlPort> {
  return { code: '', nameCn: '', nameEn: '', countryId: '', region: '', status: 1, note: '' };
}

const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blPort.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.bl.blPort.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.bl.blPort.form.codePlaceholder')
  },
  {
    key: 'nameCn',
    label: '中文名',
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.bl.blPort.form.namePlaceholder')
  },
  { key: 'nameEn', label: '英文名', type: 'input', span: 12 },
  { key: 'countryId', label: $t('page.dataManage.bl.blPort.country'), type: 'input', span: 12 },
  { key: 'region', label: '区域', type: 'input', span: 12 },
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

function openEdit(row: BlPort) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    nameCn: row.nameCn,
    nameEn: row.nameEn,
    countryId: row.countryId ?? '',
    region: row.region ?? '',
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
        ? await fetchCreateBlPort(formModel.value)
        : await fetchUpdateBlPort(formModel.value);

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
