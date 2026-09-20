<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateBlTrip, fetchUpdateBlTrip } from '@/service/api/data-manage-bl';

type BlTrip = Api.DataManageBl.BlTrip;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BlTrip>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<BlTrip> {
  return { code: '', shipDate: '', arrivalDate: '', days: undefined, status: 1, note: '' };
}

const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blTrip.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.bl.blTrip.voyage'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.blTrip.form.voyagePlaceholder')
  },
  { key: 'shipDate', label: '离港时间', type: 'date', span: 12 },
  { key: 'arrivalDate', label: '到港时间', type: 'date', span: 12 },
  { key: 'days', label: '航程天数', type: 'number', span: 12 },
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

function openEdit(row: BlTrip) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    shipDate: row.shipDate ?? '',
    arrivalDate: row.arrivalDate ?? '',
    days: row.days,
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
        ? await fetchCreateBlTrip(formModel.value)
        : await fetchUpdateBlTrip(formModel.value);

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
