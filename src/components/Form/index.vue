<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormInst, FormItemRule, FormRules } from 'naive-ui';
import { type FormItemConfig } from './form-config';

export type { FormItemConfig } from './form-config';

defineOptions({
  name: 'FormWrap'
});

type Model = Record<string, unknown>;

interface Props {
  /** 表单数据对象 */
  model: Model;
  /** 表单校验规则（item.required 也会生成基础规则并合并） */
  rules?: FormRules;
  /** 列配置项，传了则表单按配置自动渲染 */
  items?: FormItemConfig[];
  /** 24 栅格系统的列间距（px） */
  gridXGap?: number;
  /** 栅格响应式断点模式 */
  gridResponsive?: 'self' | 'screen';
  /** 标签位置，同 NForm */
  labelPlacement?: 'left' | 'top';
  /** 标签宽度，同 NForm */
  labelWidth?: number | string;
  /** 禁用所有字段 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rules: undefined,
  items: undefined,
  gridXGap: 0,
  gridResponsive: 'screen',
  labelPlacement: 'top',
  labelWidth: 'auto',
  disabled: false
});

const formRef = ref<FormInst | null>(null);

const mergedRules = computed<FormRules>(() => {
  const base: FormRules = { ...(props.rules || {}) };
  if (props.items) {
    for (const item of props.items) {
      if (item.required && !base[item.key]) {
        base[item.key] = [
          {
            required: true,
            message: item.requiredMsg || `${item.label}必填`,
            trigger: ['input', 'change', 'blur']
          }
        ] as FormItemRule[];
      }
    }
  }
  return base;
});

function getSpan(item: FormItemConfig): number | string {
  return item.span ?? 24;
}

/** 校验表单，通过后返回 true */
async function validate(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    return true;
  } catch {
    return false;
  }
}

/** 重置校验状态 */
function restoreValidation() {
  formRef.value?.restoreValidation();
}

defineExpose({
  validate,
  restoreValidation,
  formRef
});
</script>

<template>
  <NForm
    ref="formRef"
    :model="model"
    :rules="mergedRules"
    :label-placement="labelPlacement"
    :label-width="labelWidth"
    :disabled="disabled"
  >
    <template v-if="items?.length">
      <NGrid :cols="24" :x-gap="gridXGap" item-responsive :responsive="gridResponsive">
        <NGi v-for="item in items" :key="item.key" :span="getSpan(item)">
          <NFormItem :label="item.label" :path="item.key">
            <slot v-if="item.slot" :name="item.slot" :model="model" :item="item" />
            <NInput
              v-else-if="item.type === 'input' || !item.type"
              v-model:value="model[item.key] as string"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
            />
            <NInput
              v-else-if="item.type === 'textarea'"
              v-model:value="model[item.key] as string"
              type="textarea"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
            />
            <NInputNumber
              v-else-if="item.type === 'number'"
              v-model:value="model[item.key] as number"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              class="w-full"
            />
            <NSwitch
              v-else-if="item.type === 'switch'"
              v-model:value="model[item.key] as string | number | boolean"
              :disabled="item.disabled"
            >
              <template v-if="item.checkedText" #checked>{{ item.checkedText }}</template>
              <template v-if="item.uncheckedText" #unchecked>{{ item.uncheckedText }}</template>
            </NSwitch>
            <NSelect
              v-else-if="item.type === 'select'"
              v-model:value="model[item.key] as string | number"
              :options="item.options"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
            />
          </NFormItem>
        </NGi>
      </NGrid>
    </template>
    <slot v-else />
  </NForm>
</template>
