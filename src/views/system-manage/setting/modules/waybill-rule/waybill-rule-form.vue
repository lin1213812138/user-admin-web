<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';
import type { WaybillRule, WaybillRuleFormPayload } from './waybill-rule.model';

const props = withDefaults(
  defineProps<{
    /** 抽屉显隐（v-model:show） */
    show?: boolean;
    /** 编辑时传入的行数据；新建时传 null */
    row?: WaybillRule | null;
  }>(),
  {
    show: false,
    row: null
  }
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 校验通过并点击「确认」后回传表单数据 */
  submit: [payload: WaybillRuleFormPayload];
}>();

const checkDigitOptions = [
  { label: '开启校验位', value: 'open' },
  { label: '关闭校验位', value: 'close' }
];

/** 表单暂用 string 存（与 FormWrap v-model 字符串输入兼容），提交时转 number */
interface WaybillRuleForm {
  code: string;
  name: string;
  startValue: string;
  endValue: string;
  currentValue: string;
  digitLength: string;
  prefix: string;
  suffix: string;
  checkDigit: 'open' | 'close';
  remark: string;
}

function emptyForm(): WaybillRuleForm {
  return {
    code: '',
    name: '',
    startValue: '',
    endValue: '',
    currentValue: '',
    digitLength: '',
    prefix: '',
    suffix: '',
    checkDigit: 'close',
    remark: ''
  };
}

const formModel = ref<WaybillRuleForm>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const dialogTitle = computed(() => (props.row ? '编辑运单号规则' : '新建运单号规则'));

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'code', label: '编号', type: 'input', required: true, span: 12, placeholder: '请输入大于10的编号' },
  { key: 'name', label: '名称', type: 'input', required: true, span: 12, placeholder: '请输入规则名称' },
  { key: 'startValue', label: '起始值', type: 'input', required: true, span: 12, placeholder: '起始最小数值' },
  { key: 'endValue', label: '结束值', type: 'input', required: true, span: 12, placeholder: '结束最大数值' },
  { key: 'currentValue', label: '当前值', type: 'input', required: true, span: 12, placeholder: '当前使用数值' },
  { key: 'digitLength', label: '数字位数', type: 'input', span: 12, placeholder: '请输入单号长度位数' },
  { key: 'prefix', label: '前缀', type: 'input', span: 12, placeholder: '请输入前缀' },
  { key: 'suffix', label: '后缀', type: 'input', span: 12, placeholder: '请输入后缀' },
  {
    key: 'checkDigit',
    label: '验证位',
    type: 'select',
    span: 12,
    placeholder: '请选择',
    options: checkDigitOptions
  },
  { key: 'remark', label: '备注', type: 'textarea', span: 24, placeholder: '请输入备注' }
]);

// 抽屉打开时：编辑回显已有数据、新建清空
watch(
  () => [props.show, props.row],
  () => {
    if (!props.show) return;
    if (props.row) {
      const r = props.row;
      formModel.value = {
        code: r.code ?? '',
        name: r.name ?? '',
        startValue: String(r.startValue ?? ''),
        endValue: String(r.endValue ?? ''),
        currentValue: String(r.currentValue ?? ''),
        digitLength: String(r.digitLength ?? ''),
        prefix: r.prefix ?? '',
        suffix: r.suffix ?? '',
        checkDigit: r.checkDigit ?? 'close',
        remark: r.remark ?? ''
      };
    } else {
      formModel.value = emptyForm();
    }
  },
  { immediate: true }
);

function toNumber(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  const payload: WaybillRuleFormPayload = {
    code: formModel.value.code.trim(),
    name: formModel.value.name.trim(),
    prefix: formModel.value.prefix.trim(),
    suffix: formModel.value.suffix.trim(),
    startValue: toNumber(formModel.value.startValue),
    endValue: toNumber(formModel.value.endValue),
    currentValue: toNumber(formModel.value.currentValue),
    digitLength: toNumber(formModel.value.digitLength, 0),
    checkDigit: formModel.value.checkDigit,
    remark: formModel.value.remark.trim() || undefined
  };
  emit('submit', payload);
  emit('update:show', false);
}
</script>

<template>
  <Drawer
    :show="show"
    :title="dialogTitle"
    :width="720"
    :footer="true"
    @update:show="v => emit('update:show', v)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
