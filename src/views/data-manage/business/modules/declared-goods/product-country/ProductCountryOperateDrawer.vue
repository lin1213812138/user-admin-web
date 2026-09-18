<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateProductCountry, fetchUpdateProductCountry } from '@/service/api/declared-goods';

type Row = Api.DeclaredGoods.ProductCountry;
type Model = Partial<Row>;

const emit = defineEmits<{ submitted: [] }>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Model>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Model {
  return { code: '', nameCn: '' };
}

const drawerTitle = computed(
  () =>
    `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.business.declaredGoods.clearanceDestination')}`
);

const F = 'page.dataManage.business.declaredGoods.fields';

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'code', label: $t(`${F}.code`), type: 'input', required: true, span: 12, placeholder: $t(`${F}.code`) },
  { key: 'nameCn', label: $t(`${F}.nameCn`), type: 'input', required: true, span: 12, placeholder: $t(`${F}.nameCn`) },
  { key: 'nameEn', label: $t(`${F}.nameEn`), type: 'input', span: 12, placeholder: $t(`${F}.nameEn`) },
  { key: 'name', label: $t(`${F}.name`), type: 'input', span: 12 },
  { key: 'code2', label: $t(`${F}.code2`), type: 'input', span: 12 },
  { key: 'code3', label: $t(`${F}.code3`), type: 'input', span: 12 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Row) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code ?? '',
    nameCn: row.nameCn ?? '',
    nameEn: row.nameEn ?? '',
    name: row.name ?? '',
    code2: row.code2 ?? '',
    code3: row.code3 ?? ''
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
        ? await fetchCreateProductCountry(formModel.value)
        : await fetchUpdateProductCountry(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.updateSuccess'));
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
    width="520"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :grid-x-gap="16" label-placement="top" />
  </Drawer>
</template>
