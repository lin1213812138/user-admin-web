<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInst, FormItemRule, FormRules, SelectOption, UploadFileInfo } from 'naive-ui';
import { NColorPicker, NDatePicker, NUpload } from 'naive-ui';
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
  /** 控件尺寸，同 NForm（small / medium / large） */
  size?: 'small' | 'medium' | 'large';
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
  size: 'medium',
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

/** 上传控件的本地预览地址（blob），model 值本身只存文件名/URL */
const uploadPreview = reactive<Record<string, string>>({});

/** 上传控件的 file-list（由 model 值派生，受控模式保证编辑切换时正确回显） */
function uploadFileList(key: string, isImage: boolean): UploadFileInfo[] {
  const value = props.model[key];

  if (typeof value !== 'string' || !value) return [];

  const remoteUrl = /^(https?:|data:)/.test(value) ? value : undefined;
  const url = isImage ? uploadPreview[key] || remoteUrl : undefined;

  return [{ id: `${key}-${value}`, name: value, status: 'finished', url }];
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

/** 上传控件变更：文件名写回 model（单选场景取最后一个），图片额外记录本地预览地址 */
function handleUploadChange(key: string, options: { fileList: UploadFileInfo[] }) {
  const last = options.fileList[options.fileList.length - 1];

  // FormWrap 的契约是「父级传入响应式 model、按字段写回」（模板 v-model 同此约定），此处按契约写回
  // eslint-disable-next-line vue/no-mutating-props
  Object.assign(props.model, { [key]: last?.name ?? '' });

  if (last?.url?.startsWith('blob:')) {
    uploadPreview[key] = last.url;
  } else if (!last) {
    uploadPreview[key] = '';
  }
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
              :filterable="item.filterable ?? true"
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
            <NUpload
              v-else-if="item.type === 'file'"
              :file-list="uploadFileList(item.key, false)"
              :max="1"
              :default-upload="false"
              :disabled="item.disabled"
              @change="handleUploadChange(item.key, $event)"
            >
              <NButton size="small" :disabled="item.disabled">
                <template #icon>
                  <icon-mdi-upload class="text-icon" />
                </template>
                {{ $t('common.chooseFile') }}
              </NButton>
            </NUpload>
            <NUpload
              v-else-if="item.type === 'image'"
              :file-list="uploadFileList(item.key, true)"
              list-type="image-card"
              :max="1"
              :default-upload="false"
              :disabled="item.disabled"
              @change="handleUploadChange(item.key, $event)"
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
