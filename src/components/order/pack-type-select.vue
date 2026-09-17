<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'PackTypeSelect' });

const props = withDefaults(
  defineProps<{
    /** 包裹类型值（对齐后端运单 packType：0-包裹 1-袋子 2-文件） */
    value?: number | null;
    /** 禁用 */
    disabled?: boolean;
    /** 可清空 */
    clearable?: boolean;
    /** 占位文案，缺省「请选择包裹类型」 */
    placeholder?: string;
  }>(),
  {
    value: null,
    disabled: false,
    clearable: false,
    placeholder: ''
  }
);

const emit = defineEmits<{
  'update:value': [value: number | null];
}>();

/** 选项（0-包裹 1-袋子 2-文件）；用 computed 保证切换语言后文案即时更新 */
const options = computed<CommonType.Option<number>[]>(() => [
  { label: $t('page.order.packTypeOption.package'), value: 0 },
  { label: $t('page.order.packTypeOption.bag'), value: 1 },
  { label: $t('page.order.packTypeOption.file'), value: 2 }
]);

const placeholderText = computed(() => props.placeholder || $t('page.order.packTypePlaceholder'));
</script>

<template>
  <NSelect
    :value="value"
    :options="options"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholderText"
    @update:value="emit('update:value', $event as number | null)"
  />
</template>
