<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormItemRule, FormRules, SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateNoRule, fetchUpdateNoRule } from '@/service/api/no-rule';

const emit = defineEmits<{
  submitted: [];
}>();

/** 验证位选项（对齐后端 checkType） */
const checkTypeOptions: SelectOption[] = [
  { label: $t('page.dataManage.noRule.checkTypeOption.none'), value: 0 },
  { label: $t('page.dataManage.noRule.checkTypeOption.weighted'), value: 1 },
  { label: $t('page.dataManage.noRule.checkTypeOption.mod7'), value: 2 }
];

/** 系统类型选项（对齐后端 sysType；0 = 自定义） */
const sysTypeOptions: SelectOption[] = [
  { label: $t('page.dataManage.noRule.sysTypeOption.custom'), value: 0 },
  { label: $t('page.dataManage.noRule.sysTypeOption.waybill'), value: 1 },
  { label: $t('page.dataManage.noRule.sysTypeOption.customer'), value: 2 }
];

/** 表单模型（输入类字段统一 string，下拉用 number） */
interface RuleFormModel {
  name: string;
  prefix: string;
  suffix: string;
  start: string;
  end: string;
  current: string;
  len: string;
  checkType: number;
  sysType: number;
  note: string;
}

function emptyForm(): RuleFormModel {
  return {
    name: '',
    prefix: '',
    suffix: '',
    start: '',
    end: '',
    current: '',
    len: '',
    checkType: 0,
    sysType: 0,
    note: ''
  };
}

const drawerVisible = ref(false);
const editRow = ref<Api.NoRule.Item | null>(null);
const formModel = ref<RuleFormModel>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  editRow.value ? $t('page.dataManage.noRule.editTitle') : $t('page.dataManage.noRule.newTitle')
);

/** 系统内置记录名称不可改（后端 update 时忽略 name） */
const nameDisabled = computed(() => editRow.value?.buildIn === 1);

/** 正整数校验：空值先提示输入、非法值提示正整数 */
function positiveIntRule(placeholder: string): FormItemRule {
  return {
    required: true,
    validator: (_rule, value) => {
      const text = String(value ?? '').trim();
      if (!text) return new Error(placeholder);
      if (!/^\d+$/.test(text)) return new Error($t('page.dataManage.noRule.form.positiveInt'));

      return undefined;
    }
  };
}

const formRules = computed<FormRules>(() => ({
  start: positiveIntRule($t('page.dataManage.noRule.form.startPlaceholder')),
  end: positiveIntRule($t('page.dataManage.noRule.form.endPlaceholder')),
  current: positiveIntRule($t('page.dataManage.noRule.form.currentPlaceholder')),
  len: positiveIntRule($t('page.dataManage.noRule.form.lenPlaceholder'))
}));

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.noRule.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.namePlaceholder'),
    disabled: nameDisabled.value
  },
  {
    key: 'prefix',
    label: $t('page.dataManage.noRule.prefix'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.prefixPlaceholder')
  },
  {
    key: 'suffix',
    label: $t('page.dataManage.noRule.suffix'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.suffixPlaceholder')
  },
  {
    key: 'start',
    label: $t('page.dataManage.noRule.start'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.startPlaceholder')
  },
  {
    key: 'end',
    label: $t('page.dataManage.noRule.end'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.endPlaceholder')
  },
  {
    key: 'current',
    label: $t('page.dataManage.noRule.current'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.currentPlaceholder')
  },
  {
    key: 'len',
    label: $t('page.dataManage.noRule.len'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.noRule.form.lenPlaceholder')
  },
  {
    key: 'checkType',
    label: $t('page.dataManage.noRule.checkType'),
    type: 'select',
    span: 12,
    options: checkTypeOptions,
    filterable: false
  },
  {
    key: 'sysType',
    label: $t('page.dataManage.noRule.sysType'),
    type: 'select',
    span: 12,
    options: sysTypeOptions,
    filterable: false
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.dataManage.noRule.form.notePlaceholder')
  }
]);

function openCreate() {
  editRow.value = null;
  formModel.value = emptyForm();
  drawerVisible.value = true;
}

function openEdit(row: Api.NoRule.Item) {
  editRow.value = row;
  formModel.value = {
    name: row.name ?? '',
    prefix: row.prefix ?? '',
    suffix: row.suffix ?? '',
    start: String(row.start ?? ''),
    end: String(row.end ?? ''),
    current: String(row.current ?? ''),
    len: row.len == null ? '' : String(row.len),
    checkType: row.checkType ?? 0,
    sysType: row.sysType ?? 0,
    note: row.note ?? ''
  };
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  const params: Api.NoRule.SaveParams = {
    name: formModel.value.name.trim(),
    start: formModel.value.start.trim(),
    end: formModel.value.end.trim(),
    current: formModel.value.current.trim(),
    len: Number(formModel.value.len),
    prefix: formModel.value.prefix.trim(),
    suffix: formModel.value.suffix.trim(),
    checkType: formModel.value.checkType as Api.NoRule.CheckType,
    sysType: formModel.value.sysType as Api.NoRule.SysType,
    note: formModel.value.note.trim()
  };

  if (editRow.value) {
    const { error } = await fetchUpdateNoRule({ _id: editRow.value._id, ...params });
    if (error) return;
  } else {
    const { error } = await fetchCreateNoRule(params);
    if (error) return;
  }

  drawerVisible.value = false;
  emit('submitted');
  window.$message?.success($t('common.saveSuccess'));
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer v-model:show="drawerVisible" :title="drawerTitle" :width="720" :footer="true" @submit="handleDrawerSubmit">
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :rules="formRules" />
  </Drawer>
</template>
