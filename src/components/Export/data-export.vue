<script setup lang="ts">
/**
 * 入口 B：不依赖表格的字段选择导出
 * 调用方自行摆放触发按钮（v-model:visible 控制），传入字段清单 + 行数据即可。
 */

import { computed, ref } from 'vue';
import { $t } from '@/locales';
import FieldSelectDialog from './field-select-dialog.vue';
import { exportRowsToXlsx } from './export-xlsx';
import type { ExportConfirmPayload, ExportField } from './type';

defineOptions({
  name: 'DataExport'
});

interface Props {
  visible: boolean;
  /** 导出字段清单（含可选 formatter，如状态转文案） */
  fields: ExportField[];
  /** 导出的行数据 */
  data: unknown[];
  /** 导出文件名（不含扩展名） */
  filename?: string;
}

const props = withDefaults(defineProps<Props>(), {
  filename: undefined
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();

const visible = computed<boolean>({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

const exporting = ref(false);

async function handleExport(payload: ExportConfirmPayload) {
  if (exporting.value) return;
  exporting.value = true;
  try {
    await exportRowsToXlsx(props.data, payload.fields, props.filename);
    window.$message?.success($t('common.exportSuccess'));
    visible.value = false;
  } catch (error) {
    console.error('export failed', error);
    window.$message?.error($t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <FieldSelectDialog v-model:visible="visible" :fields="fields" :loading="exporting" @confirm="handleExport" />
</template>

<style scoped></style>
