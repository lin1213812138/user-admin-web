<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateFbaWarehouse, fetchUpdateFbaWarehouse } from '@/service/api/data-manage-basic';
import { useCountrySelect } from '@/hooks/business/use-country-select';

type BasicFbaWarehouse = Api.DataManage.BasicFbaWarehouse;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BasicFbaWarehouse>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

/** 所属国家下拉选项：来自国家地区（/country/query），由公共 Hook 提供并缓存 */
const { options: countryOptions, load: loadCountryOptions, getName: getCountryName } = useCountrySelect();
onMounted(loadCountryOptions);

function emptyForm(): Partial<BasicFbaWarehouse> {
  return { code: '', warehouse: '', name: '', phone: '', countryId: '', city: '', state: '', zip: '', address: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.basic.fbaWarehouse.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.basic.fbaWarehouse.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.basic.fbaWarehouse.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.form.codePlaceholder')
  },
  {
    key: 'warehouse',
    label: $t('page.dataManage.basic.fbaWarehouse.warehouse'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.form.warehousePlaceholder')
  },
  { key: 'name', label: $t('page.dataManage.basic.fbaWarehouse.name'), type: 'input', span: 12 },
  { key: 'phone', label: $t('page.dataManage.basic.fbaWarehouse.phone'), type: 'input', span: 12 },
  {
    key: 'countryId',
    label: $t('page.dataManage.basic.fbaWarehouse.country'),
    type: 'select',
    span: 12,
    clearable: true,
    options: countryOptions.value,
    placeholder: $t('page.dataManage.basic.fbaWarehouse.country')
  },
  { key: 'city', label: $t('page.dataManage.basic.fbaWarehouse.city'), type: 'input', span: 12 },
  { key: 'state', label: $t('page.dataManage.basic.fbaWarehouse.state'), type: 'input', span: 12 },
  { key: 'zip', label: $t('page.dataManage.basic.fbaWarehouse.zip'), type: 'input', span: 12 },
  { key: 'address', label: $t('page.dataManage.basic.fbaWarehouse.address'), type: 'input', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: BasicFbaWarehouse) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    warehouse: row.warehouse,
    name: row.name,
    phone: row.phone,
    countryId: row.countryId,
    city: row.city,
    state: row.state,
    zip: row.zip,
    address: row.address
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    // 后端 Fba 同时存 countryId 与 country（名称），提交时由选中项反查名称
    const payload = { ...formModel.value, country: getCountryName(formModel.value.countryId) };
    const { error } =
      drawerMode.value === 'create' ? await fetchCreateFbaWarehouse(payload) : await fetchUpdateFbaWarehouse(payload);
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
