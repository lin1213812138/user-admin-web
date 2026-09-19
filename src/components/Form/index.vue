<script setup lang="ts">
import { computed, ref, type VNodeChild } from 'vue';
import type { FormInst, FormItemRule, FormRules, SelectOption } from 'naive-ui';
import { NColorPicker, NDatePicker } from 'naive-ui';
import { $t } from '@/locales';
import { type FormItemConfig } from './form-config';
import IconPicker from '@/components/custom/icon-picker.vue';
import IconRenderer from '@/components/custom/icon-renderer.vue';
import Upload from '@/components/Upload/index.vue';

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
  /** 控件尺寸，同 NForm（small / medium / large） */
  size?: 'small' | 'medium' | 'large';
  /** 禁用所有字段 */
  disabled?: boolean;
  /** 展示模式：edit = 控件编辑，view = 只读文本（详情 / 查看场景） */
  mode?: 'edit' | 'view';
}

const props = withDefaults(defineProps<Props>(), {
  rules: undefined,
  items: undefined,
  gridXGap: 16,
  gridResponsive: 'screen',
  // 不设静态默认值：由 resolvedLabelPlacement 按 mode 决定（父级显式传值优先）
  labelPlacement: undefined,
  labelWidth: 'auto',
  size: 'medium',
  disabled: false,
  mode: 'edit'
});

const formRef = ref<FormInst | null>(null);

/** 是否只读展示态：值区域渲染纯文本，不渲染任何控件、不参与校验 */
const isView = computed(() => props.mode === 'view');

/** 标签位置：查看详情（view）默认左标签、宽度自适应；编辑态保持顶部。父级显式传值优先 */
const resolvedLabelPlacement = computed<'left' | 'top'>(() => props.labelPlacement ?? (isView.value ? 'left' : 'top'));

/** 只读文本的空值占位符 */
const EMPTY_TEXT = '-';

/** 空值判定：0 / false 都是有效值，不算空 */
function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

/** 值是否为可直接加载的 URL（图片详情态据此决定显示缩略图还是文件名） */
function isUrlValue(value: unknown): boolean {
  return typeof value === 'string' && /^(https?:|data:|blob:)/.test(value);
}

/** 用选项列表把值反查为展示文案（查不到时回退原值） */
function optionLabel(options: SelectOption[] | undefined, value: unknown): string {
  const matched = (options ?? []).find(opt => opt.value === value);

  return matched ? String(matched.label ?? value) : String(value);
}

/** select 的 render-label 兜底：优先使用 option 自带的 renderLabel，否则回退纯文本 label */
function fallbackOptionLabel(option: SelectOption): VNodeChild {
  const custom = (option as SelectOption & { renderLabel?: (opt: SelectOption) => VNodeChild }).renderLabel;

  if (typeof custom === 'function') return custom(option);

  return String(option.label ?? option.value ?? '');
}

/** 只读文本：按控件类型把值映射为展示文案（空值统一占位符） */
function viewText(item: FormItemConfig): string {
  const value = props.model[item.key];

  if (isEmptyValue(value)) return EMPTY_TEXT;

  switch (item.type) {
    // 密码固定脱敏，详情态不暴露明文
    case 'password':
      return '••••••';
    case 'select':
      return Array.isArray(value)
        ? value.map(v => optionLabel(item.options, v)).join('、')
        : optionLabel(item.options, value);
    case 'checkbox':
      return (value as unknown[]).map(v => optionLabel(item.options, v)).join('、');
    case 'switch': {
      const checked = item.checkedValue === undefined ? value === true : value === item.checkedValue;

      return checked ? item.checkedText || $t('common.enable') : item.uncheckedText || $t('common.disable');
    }
    default:
      return String(value);
  }
}

/** 只读文本的样式类：空值用灰色占位符 */
function viewTextClass(item: FormItemConfig): string {
  return `text-14px leading-22px${isEmptyValue(props.model[item.key]) ? ' text-gray-400' : ''}`;
}

/** field items (exclude slot-only action items) */
const fieldItems = computed<FormItemConfig[]>(() => (props.items ?? []).filter(i => !i.slot));
/** slot-only action items, rendered in the right action area */
const actionItems = computed<FormItemConfig[]>(() => (props.items ?? []).filter(i => i.slot));

/** checkbox 选项值（SelectOption.value 可能为数组/null，这里收敛为 string | number） */
function cbValue(opt: SelectOption): string | number {
  return opt.value as string | number;
}

/** 日期控件的值：model 中的空串需转 null（NDatePicker 收到 `''` 会抛 "Invalid time value"） */
function dateValue(key: string): string | null {
  const value = props.model[key];

  return typeof value === 'string' && value ? value : null;
}

/** 日期控件变更：null 写回空串（与其它文本字段的空值口径一致） */
function handleDateChange(key: string, value: string | null) {
  // FormWrap 的契约是「父级传入响应式 model、按字段写回」（模板 v-model 同此约定）
  // eslint-disable-next-line vue/no-mutating-props
  Object.assign(props.model, { [key]: value ?? '' });
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
  // 只读展示态不参与校验（同时避免 NFormItem 显示必填星号）
  if (isView.value) return {};

  const base: FormRules = { ...props.rules };
  for (const item of fieldItems.value) {
    if (item.required && !base[item.key]) {
      const message = item.requiredMsg || `${item.label}必填`;
      const rule: FormItemRule = {
        required: true,
        message,
        trigger: ['change', 'blur'],
        // Custom empty check instead of async-validator's built-in `required` rule: when
        // `trigger` is set, the built-in rule falls back to the `string` validator, which
        // wrongly treats a valid number (e.g. 0) as empty. `required: true` here only drives
        // naive-ui's required mark (rules.some(r => r.required)), not the empty check.
        // 注意：不用 callback 风格而直接返回 `Error | undefined`——naive 的 FormItemRuleValidator
        // 返回类型不含 void，callback 风格会报 TS2322。
        validator: (_rule, value) => {
          const empty =
            value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

          return empty ? new Error(message) : undefined;
        }
      };
      base[item.key] = [rule];
    }
  }
  return base;
});

function getSpan(item: FormItemConfig): number | string {
  return item.span ?? 24;
}

// 展开收起功能暂时下线（恢复时一并取消注释）
// function toggleExpand() {
//   expanded.value = !expanded.value;
// }

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
    :label-placement="resolvedLabelPlacement"
    :label-width="labelWidth"
    :size="size"
    :disabled="disabled"
  >
    <template v-if="fieldItems.length">
      <NGrid :cols="24" :x-gap="gridXGap" item-responsive :responsive="gridResponsive">
        <NGi v-for="item in visibleFieldItems" :key="item.key" :span="getSpan(item)">
          <!-- 区块标题：占整行、不包 NFormItem（无 label 行、不参与校验） -->
          <div v-if="item.type === 'section'" class="w-full flex items-center gap-8px py-4px">
            <span class="h-16px w-3px rounded-2px bg-primary" />
            <span class="text-15px font-600">{{ item.label }}</span>
          </div>
          <NFormItem v-else :label="item.label" :path="item.key" :show-label="item.showLabel">
            <!-- 只读展示态：值区域渲染纯文本，不渲染控件 -->
            <template v-if="isView">
              <NImage
                v-if="item.type === 'image' && isUrlValue(model[item.key])"
                :src="String(model[item.key])"
                width="80"
              />
              <span v-else-if="item.type === 'icon-picker'" class="flex items-center gap-6px">
                <IconRenderer v-if="model[item.key]" :icon="String(model[item.key])" :size="16" />
                <span :class="viewTextClass(item)">{{ viewText(item) }}</span>
              </span>
              <span v-else-if="item.type === 'color'" class="flex items-center gap-8px">
                <span
                  class="h-16px w-16px shrink-0 rounded-2px border border-solid border-#e5e7eb dark:border-#2a2a2a"
                  :style="{ backgroundColor: String(model[item.key]) }"
                />
                <span :class="viewTextClass(item)">{{ viewText(item) }}</span>
              </span>
              <slot v-else-if="item.type === 'custom'" :name="item.key" :model="model" :item="item" />
              <span v-else :class="viewTextClass(item)">{{ viewText(item) }}</span>
            </template>
            <template v-else>
              <NInput
                v-if="item.type === 'input' || !item.type"
                v-model:value="model[item.key] as string"
                :placeholder="item.placeholder"
                :disabled="item.disabled"
                :clearable="item.clearable ?? true"
              />
              <NInput
                v-else-if="item.type === 'textarea'"
                v-model:value="model[item.key] as string"
                type="textarea"
                :rows="item.rows ?? 1"
                :placeholder="item.placeholder"
                :disabled="item.disabled"
              />
              <NInput
                v-else-if="item.type === 'password'"
                v-model:value="model[item.key] as string"
                type="password"
                show-password-on="click"
                :placeholder="item.placeholder"
                :disabled="item.disabled"
              />
              <NInputNumber
                v-else-if="item.type === 'number'"
                v-model:value="model[item.key] as number"
                :placeholder="item.placeholder"
                :disabled="item.disabled"
                :clearable="item.clearable ?? true"
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
                v-model:value="model[item.key] as string | number | Array<string | number>"
                :options="item.options"
                :placeholder="item.placeholder"
                :disabled="item.disabled"
                :clearable="item.clearable ?? true"
                :filterable="item.filterable ?? true"
                :multiple="item.multiple || false"
                :render-label="item.renderLabel ?? fallbackOptionLabel"
                @update:value="(value, option) => item.onUpdate?.(value, option)"
              />
              <NDatePicker
                v-else-if="item.type === 'date'"
                :formatted-value="dateValue(item.key)"
                value-format="yyyy-MM-dd"
                type="date"
                clearable
                :placeholder="item.placeholder"
                :disabled="item.disabled"
                class="w-full"
                @update:formatted-value="handleDateChange(item.key, $event)"
              />
              <Upload
                v-else-if="item.type === 'file'"
                v-model:value="model[item.key] as string"
                :dest="item.dest ?? 1"
                list-type="file"
                :accept="item.accept"
                :max="1"
                :disabled="item.disabled"
                show-file-list
              />
              <Upload
                v-else-if="item.type === 'image'"
                v-model:value="model[item.key] as string"
                :dest="item.dest ?? 1"
                list-type="image-card"
                :accept="item.accept ?? 'image/*'"
                :max="1"
                :disabled="item.disabled"
              />
              <NColorPicker
                v-else-if="item.type === 'color'"
                v-model:value="model[item.key] as string"
                :disabled="item.disabled"
                :show-alpha="false"
                class="w-full"
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
              <slot v-else-if="item.type === 'custom'" :name="item.key" :model="model" :item="item" />
            </template>
          </NFormItem>
        </NGi>
      </NGrid>
      <div v-if="actionItems.length || showToggle" class="flex-y-center justify-end gap-8px">
        <template v-for="it in actionItems" :key="it.key">
          <slot :name="it.slot" :model="model" :item="it" />
        </template>
        <!-- 展开收起按钮暂时下线（恢复时一并取消注释，同时恢复 script 中的 toggleExpand） -->
        <!--
 <LButton v-if="showToggle" text type="primary" @click="toggleExpand">
          {{ expanded ? $t('common.collapseFilter') : $t('common.expandFilter') }}
          <icon-ic-baseline-keyboard-arrow-up v-if="expanded" class="text-icon" />
          <icon-ic-baseline-keyboard-arrow-down v-else class="text-icon" />
        </LButton>
-->
      </div>
    </template>
    <slot v-else />
  </NForm>
</template>
