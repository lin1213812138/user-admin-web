<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateNoPool, fetchUpdateNoPool, type NoPool as NoPoolItem } from '@/service/api/data-manage-no-rule';

const emit = defineEmits<{
  submitted: [];
}>();

const refTypeOptions = [
  { label: '收货渠道', value: 0 },
  { label: '发货渠道', value: 1 },
  { label: '派送渠道', value: 2 }
];

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<NoPoolItem>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<NoPoolItem> {
  return { no: '', refId: '', refType: 0, status: 1, note: '' };
}
const drawerTitle = computed(() => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}运单号码池`);
const formItems = computed<FormItemConfig[]>(() => [
  { key: 'no', label: '号码', type: 'input', required: true, span: 24 },
  { key: 'refId', label: '收发货渠道', type: 'input', required: true, span: 24 },
  { key: 'refType', label: '关联类型', type: 'select', required: true, span: 24, options: refTypeOptions },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);
function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
function openEdit(row: NoPoolItem) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    no: row.no,
    refId: row.refId,
    refType: row.refType,
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
        ? await fetchCreateNoPool(formModel.value)
        : await fetchUpdateNoPool(formModel.value);
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
