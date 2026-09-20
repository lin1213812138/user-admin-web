<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateItemNoRule,
  fetchUpdateItemNoRule,
  type ItemNoRule as ItemNoRuleItem
} from '@/service/api/data-manage-no-rule';

const emit = defineEmits<{
  submitted: [];
}>();

const prefixTypeOptions = [
  { label: '内单号', value: 0 },
  { label: '转单号', value: 1 },
  { label: '客户单号', value: 2 },
  { label: '派送单号', value: 3 }
];
const suffixTypeOptions = [{ label: '箱序号', value: 0 }];
const suffixPadOptions = [
  { label: '原始长度', value: 0 },
  { label: '按总件数位数', value: 1 },
  { label: '3位', value: 2 },
  { label: '4位', value: 3 }
];

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<ItemNoRuleItem>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
function emptyForm(): Partial<ItemNoRuleItem> {
  return { name: '', prefixType: 0, middleType: 1, suffixType: 0, suffixPadType: 0, status: 1, note: '' };
}
const drawerTitle = computed(() => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}子单号规则`);
const formItems = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '规则名称', type: 'input', required: true, span: 24 },
  { key: 'prefixType', label: '单号首段', type: 'select', required: true, span: 12, options: prefixTypeOptions },
  { key: 'middleType', label: '单号中段', type: 'select', span: 12, options: [{ label: '总件数', value: 1 }] },
  { key: 'suffixType', label: '单号尾段', type: 'select', required: true, span: 12, options: suffixTypeOptions },
  { key: 'suffixPadType', label: '尾段补全', type: 'select', span: 12, options: suffixPadOptions },
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
function openEdit(row: ItemNoRuleItem) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    prefixType: row.prefixType,
    middleType: row.middleType ?? 1,
    suffixType: row.suffixType,
    suffixPadType: row.suffixPadType,
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
        ? await fetchCreateItemNoRule(formModel.value)
        : await fetchUpdateItemNoRule(formModel.value);
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
