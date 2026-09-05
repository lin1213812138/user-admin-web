<script setup lang="ts">
/**
 * exceljs「字段选择导出」（自带触发按钮，弹字段勾选弹窗）
 * 页面需要字段勾选 / 全量导出 / 含隐藏列 / status 文案时，把本组件放进表格左侧操作栏即可。
 * 与通用 Table 右上的 vxe 原生一键导出（action-export）互不依赖，可并存。
 */

import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import FieldSelectDialog from './field-select-dialog.vue';
import { exportRowsToXlsx } from './export-xlsx';
import { toExportFields } from './type';
import type { ExportColumnSource, ExportConfirmPayload, ExportField, ExportScope, ExportScopeOption } from './type';

defineOptions({
  name: 'TableExportAction'
});

interface Props {
  /** 可选字段列来源（表格全部列配置，可含用户隐藏列） */
  columns: ExportColumnSource[];
  /** 表格当前数据（无 fetchAll 时导出这些） */
  data: unknown[];
  /** 表格列之外追加的导出字段 */
  extraFields?: ExportField[];
  /** 确认导出时拉取全量（分页页用）；不传则用当前 data */
  fetchAll?: () => Promise<unknown[]>;
  /** 勾选的数据（表格开了 show-checkbox 时由页面 @selection-change 透传）；不传则「勾选数据」灰显禁用 */
  checkedData?: unknown[];
  /** 是否显示「数据范围」选项；关闭后退化为「有 fetchAll 导全量，否则导当前页」 */
  showScope?: boolean;
  /** 导出文件名（不含扩展名） */
  filename?: string;
}

const props = withDefaults(defineProps<Props>(), {
  extraFields: undefined,
  fetchAll: undefined,
  checkedData: undefined,
  showScope: true,
  filename: undefined
});

const visible = ref(false);
const exporting = ref(false);

/** 默认范围：有 fetchAll 取全量，否则当前页（与改造前行为一致） */
const defaultScope = computed<ExportScope>(() => (props.fetchAll ? 'all' : 'page'));
const currentScope = ref<ExportScope>(defaultScope.value);
const checkedCount = computed(() => props.checkedData?.length ?? 0);

/** 每次打开弹窗都重置为默认范围，不记忆上次选择 */
watch(visible, val => {
  if (val) {
    currentScope.value = defaultScope.value;
  }
});

/** 范围选项：全部依赖 fetchAll，勾选依赖勾选行数，不可用时灰显并给出原因 */
const scopeOptions = computed<ExportScopeOption[]>(() => {
  if (!props.showScope) return [];
  return [
    {
      value: 'all',
      label: $t('common.exportScopeAll'),
      disabled: !props.fetchAll,
      hint: props.fetchAll ? undefined : $t('common.exportScopeAllUnavailable')
    },
    { value: 'page', label: $t('common.exportScopePage', { count: props.data.length }), disabled: false },
    {
      value: 'checked',
      label: $t('common.exportScopeChecked', { count: checkedCount.value }),
      disabled: checkedCount.value === 0
    }
  ];
});

/** 按范围取行数据；scope 为 null（未启用范围区）时退回默认范围 */
function resolveRows(scope: ExportScope | null): Promise<unknown[]> | unknown[] {
  const target = scope ?? defaultScope.value;
  if (target === 'all' && props.fetchAll) return props.fetchAll();
  if (target === 'checked') return props.checkedData ?? [];
  return props.data;
}

/** 弹窗字段 = 传入列配置（含隐藏列）转换 + extraFields，同 key 以 extra 覆盖 */
const exportFields = computed<ExportField[]>(() => {
  const map = new Map<string, ExportField>();
  for (const field of toExportFields(props.columns)) {
    map.set(field.key, field);
  }
  for (const field of props.extraFields ?? []) {
    map.set(field.key, field);
  }
  return [...map.values()];
});

async function handleExport(payload: ExportConfirmPayload) {
  if (exporting.value) return;
  // 勾选项被绕开（如外部数据变化）时兜底提示，且不关闭弹窗
  if (payload.scope === 'checked' && checkedCount.value === 0) {
    window.$message?.warning($t('common.exportScopeCheckedEmpty'));
    return;
  }
  exporting.value = true;
  try {
    const rows = await resolveRows(payload.scope);
    await exportRowsToXlsx(rows, payload.fields, props.filename);
    window.$message?.success($t('common.exportSuccess'));
    visible.value = false;
  } catch (error) {
    console.error('export failed', error);
    // 失败不关闭弹窗，方便调整后重试
    window.$message?.error($t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <NButton
    v-if="exportFields.length > 0"
    type="success"
    size="small"
    ghost
    :loading="exporting"
    @click="visible = true"
  >
    <template #icon>
      <icon-mdi-download class="text-icon" />
    </template>
    {{ $t('common.export') }}
  </NButton>

  <FieldSelectDialog
    v-model:visible="visible"
    v-model:scope="currentScope"
    :fields="exportFields"
    :scopes="scopeOptions"
    :loading="exporting"
    @confirm="handleExport"
  />
</template>

<style scoped></style>
