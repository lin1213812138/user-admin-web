<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateCountry, fetchUpdateCountry } from '@/service/api/data-manage-basic';

type BasicCountryRegion = Api.DataManage.BasicCountryRegion;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BasicCountryRegion>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BasicCountryRegion> {
  return { code: '', nameCn: '', nameEn: '', name: '', code2: '', code3: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.basic.countryRegion.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.basic.countryRegion.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.basic.countryRegion.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.countryRegion.form.codePlaceholder')
  },
  {
    key: 'nameCn',
    label: $t('page.dataManage.basic.countryRegion.nameCn'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.countryRegion.form.nameCnPlaceholder')
  },
  { key: 'nameEn', label: $t('page.dataManage.basic.countryRegion.nameEn'), type: 'input', span: 12 },
  { key: 'name', label: $t('page.dataManage.basic.countryRegion.name'), type: 'input', span: 12 },
  { key: 'code2', label: $t('page.dataManage.basic.countryRegion.code2'), type: 'input', span: 12 },
  { key: 'code3', label: $t('page.dataManage.basic.countryRegion.code3'), type: 'input', span: 12 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: BasicCountryRegion) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    nameCn: row.nameCn,
    nameEn: row.nameEn,
    name: row.name,
    code2: row.code2,
    code3: row.code3
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
        ? await fetchCreateCountry(formModel.value)
        : await fetchUpdateCountry(formModel.value);
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
