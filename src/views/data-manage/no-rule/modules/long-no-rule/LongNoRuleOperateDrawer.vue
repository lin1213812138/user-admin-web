<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateLongNoRule,
  fetchUpdateLongNoRule,
  type LongNoRule as LongNoRuleItem
} from '@/service/api/data-manage-no-rule';

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<LongNoRuleItem>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<LongNoRuleItem> {
  return { name: '', oriLen: 0, start: 0, len: 0, rule: '', status: 1, note: '' };
}
const drawerTitle = computed(() => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}长单号截短`);
const formItems = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '规则名称', type: 'input', required: true, span: 24 },
  { key: 'oriLen', label: '原始长度', type: 'number', required: true, span: 12 },
  { key: 'start', label: '截取开始位置', type: 'number', required: true, span: 12 },
  { key: 'len', label: '截取长度', type: 'number', required: true, span: 12 },
  { key: 'rule', label: '单号掩码', type: 'input', span: 24 },
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
function openEdit(row: LongNoRuleItem) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    oriLen: row.oriLen,
    start: row.start,
    len: row.len,
    rule: row.rule ?? '',
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
        ? await fetchCreateLongNoRule(formModel.value)
        : await fetchUpdateLongNoRule(formModel.value);
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
