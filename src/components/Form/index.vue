<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormInst, FormItemRule, FormRules, SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { type FormItemConfig } from './form-config';
import IconPicker from '@/components/custom/icon-picker.vue';

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
  gridXGap: 16,
  gridResponsive: 'screen',
  labelPlacement: 'top',
  labelWidth: 'auto',
  disabled: false
});

const formRef = ref<FormInst | null>(null);

/** field items (exclude slot-only action items) */
const fieldItems = computed<FormItemConfig[]>(() => (props.items ?? []).filter(i => !i.slot));
/** slot-only action items, rendered in the right action area */
const actionItems = computed<FormItemConfig[]>(() => (props.items ?? []).filter(i => i.slot));

/** checkbox 选项值（SelectOption.value 可能为数组/null，这里收敛为 string | number） */
function cbValue(opt: SelectOption): string | number {
  return opt.value as string | number;
}

/** total rows by span accumulation (24 per row) */
const totalRows = computed<number>(() => {
  let used = 0;
  let rows = 0;
  for (const item of fieldItems.value) {
    const span = Number(item.span ?? 24);
    if (used + span > 24) {
      rows += 1;
      used = span;
    } else {
      used += span;
    }
  }
  if (used > 0) rows += 1;
  return rows;
});

/** whether to show expand/collapse toggle: only when action items exist and rows exceed 1 */
const showToggle = computed<boolean>(() => actionItems.value.length > 0 && totalRows.value > 1);

const expanded = ref(true);

/** visible field items: when collapsed, only the first row */
const visibleFieldItems = computed<FormItemConfig[]>(() => {
  if (expanded.value || !showToggle.value) return fieldItems.value;
  let used = 0;
  let rows = 0;
  const result: FormItemConfig[] = [];
  for (const item of fieldItems.value) {
    const span = Number(item.span ?? 24);
    if (used + span > 24) {
      rows += 1;
      used = span;
    } else {
      used += span;
    }
    if (rows >= 1) break;
    result.push(item);
  }
  return result;
});

const mergedRules = computed<FormRules>(() => {
  const base: FormRules = { ...props.rules };
  for (const item of fieldItems.value) {
    if (item.required && !base[item.key]) {
      const rule: FormItemRule = {
        required: true,
        message: item.requiredMsg || `${item.label}必填`,
        trigger: ['change', 'blur']
      };
      // Numeric field: declare `type: 'number'` so async-validator does not treat a
      // number value (incl. valid `0`) as empty and wrongly fail the required check.
      if (item.type === 'number') {
        rule.type = 'number';
      }
      base[item.key] = [rule];
    }
  }
  return base;
});

function getSpan(item: FormItemConfig): number | string {
  return item.span ?? 24;
}

function toggleExpand() {
  expanded.value = !expanded.value;
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
    <template v-if="fieldItems.length">
      <NGrid :cols="24" :x-gap="gridXGap" item-responsive :responsive="gridResponsive">
        <NGi v-for="item in visibleFieldItems" :key="item.key" :span="getSpan(item)">
          <NFormItem :label="item.label" :path="item.key">
            <NInput
              v-if="item.type === 'input' || !item.type"
              v-model:value="model[item.key] as string"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :clearable="item.clearable || true"
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
              :clearable="item.clearable || true"
              class="w-full"
            />
            <NSwitch
              v-else-if="item.type === 'switch'"
              v-model:value="model[item.key] as string | number | boolean"
              :disabled="item.disabled"
              :checked-value="item.checkedValue"
              :unchecked-value="item.uncheckedValue"
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
              :clearable="item.clearable || true"
            />
            <NCheckboxGroup
              v-else-if="item.type === 'checkbox'"
              v-model:value="model[item.key] as (string | number)[]"
              :disabled="item.disabled"
            >
              <NSpace>
                <NCheckbox v-for="opt in item.options ?? []" :key="String(opt.value)" :value="cbValue(opt)">
                  {{ opt.label }}
                </NCheckbox>
              </NSpace>
            </NCheckboxGroup>
            <IconPicker
              v-else-if="item.type === 'icon-picker'"
              v-model:value="model[item.key] as string"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
            />
          </NFormItem>
        </NGi>
      </NGrid>
      <div v-if="actionItems.length || showToggle" class="flex-y-center justify-end gap-8px">
        <template v-for="it in actionItems" :key="it.key">
          <slot :name="it.slot" :model="model" :item="it" />
        </template>
        <NButton v-if="showToggle" text type="primary" @click="toggleExpand">
          {{ expanded ? $t('common.collapseFilter') : $t('common.expandFilter') }}
          <icon-ic-baseline-keyboard-arrow-up v-if="expanded" class="text-icon" />
          <icon-ic-baseline-keyboard-arrow-down v-else class="text-icon" />
        </NButton>
      </div>
    </template>
    <slot v-else />
  </NForm>
</template>
