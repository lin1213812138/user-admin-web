<script setup lang="ts">
/**
 * 共用导出字段弹窗：以可编辑表格形式配置导出列
 * - 勾选决定该字段是否导出（表头全选）
 * - 「字段名称」可编辑，直接作为 Excel 表头
 * - 拖拽行调整导出列顺序
 * - 「新增字段」追加自定义列：可按数据字段取值，或整列写固定值；自定义列可删除
 * 纯 UI 组件：确认时回传勾选且排序后的字段，真正的导出动作交给调用方。
 */

import { computed, ref, watch } from 'vue';
import Sortable from 'sortablejs';
import { $t } from '@/locales';
import type { ExportConfirmPayload, ExportField, ExportScope, ExportScopeOption, ExportValueMode } from './type';

defineOptions({
  name: 'FieldSelectDialog'
});

interface Props {
  visible: boolean;
  /** 可配置字段（打开时深拷贝为本地副本，不改动 props） */
  fields: ExportField[];
  /** 导出中状态：用于底部按钮 loading 防重 */
  loading?: boolean;
  /** 弹窗标题，缺省「导出字段」 */
  title?: string;
  /** 可选：数据范围选项；不传或空数组则不渲染范围区（DataExport 场景） */
  scopes?: ExportScopeOption[];
  /** 当前选中的数据范围，配合 update:scope 使用；null 表示调用方未启用范围区 */
  scope?: ExportScope | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: undefined,
  scopes: undefined,
  scope: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'update:scope', scope: ExportScope): void;
  /** 确认导出：回传选中的范围与勾选排序后的字段 */
  (e: 'confirm', payload: ExportConfirmPayload): void;
}

const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

/** 本地范围值：naive-ui 的 value 是宽类型，收窄时按 scopes 反查，避免类型断言 */
const currentScope = ref<ExportScope | null>(props.scope);

function handleScopeChange(value: string | number | boolean | null) {
  const matched = props.scopes?.find(item => item.value === value);
  if (!matched) return;
  currentScope.value = matched.value;
  emit('update:scope', matched.value);
}

/** 弹窗内的可编辑行：id 是稳定行标识（自定义字段的 key 可被用户编辑） */
interface FieldItem extends ExportField {
  id: string;
  checked: boolean;
  /** 是否弹窗内新增的自定义字段（可改取值方式、可删除） */
  custom: boolean;
  valueMode: ExportValueMode;
  fixedValue: string;
}

/** 自定义字段自增序号：用于生成不重复的 id 与默认列名 */
let customSeq = 0;

function snapshot(): FieldItem[] {
  return props.fields.map(field => ({
    ...field,
    id: field.key,
    checked: true,
    custom: false,
    valueMode: 'field' as ExportValueMode,
    fixedValue: ''
  }));
}

const items = ref<FieldItem[]>([]);

const tableRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;
/** 拖拽结果暂存：onEnd 只记录索引，确认时才应用到数据，避免拖拽过程中表格重绘跳动 */
let pendingDrag: { oldIndex: number; newIndex: number } | null = null;
let pollTimer: number | null = null;

const valueModeOptions = computed(() => [
  { label: $t('common.valueModeField'), value: 'field' },
  { label: $t('common.valueModeFixed'), value: 'fixed' }
]);

const checkedCount = computed(() => items.value.filter(item => item.checked).length);
const selectAllChecked = computed(() => items.value.length > 0 && checkedCount.value === items.value.length);
const selectAllIndeterminate = computed(() => checkedCount.value > 0 && checkedCount.value < items.value.length);

function toggleSelectAll(checked: boolean) {
  items.value.forEach(item => {
    item.checked = checked;
  });
}

/** 新增自定义字段：默认「取数据」模式（key 留空待填），用户可切换为固定值 */
function addField() {
  customSeq += 1;
  items.value.push({
    id: `custom_${customSeq}`,
    key: '',
    title: `${$t('common.customField')}${customSeq}`,
    checked: true,
    custom: true,
    valueMode: 'field',
    fixedValue: ''
  });
}

function removeField(row: FieldItem) {
  items.value = items.value.filter(item => item.id !== row.id);
}

/** 行拖拽：vxe-table 渲染完后绑定 tbody，handle 限定拖拽图标 */
function initSortable() {
  if (sortableInstance) return; // 已创建则跳过，避免拖拽中被重建打断
  const tbody = tableRef.value?.querySelector<HTMLElement>('.vxe-table--body tbody');
  if (!tbody) return;

  sortableInstance = Sortable.create(tbody, {
    animation: 300,
    handle: '.rank-icon',
    draggable: '.vxe-body--row',
    forceFallback: true,
    fallbackClass: 'sortable-drag',
    dragClass: 'sortable-drag',
    chosenClass: 'sortable-chosen',
    onEnd: evt => {
      if (evt.oldIndex === evt.newIndex || evt.oldIndex == null || evt.newIndex == null) return;
      pendingDrag = { oldIndex: evt.oldIndex, newIndex: evt.newIndex };
    }
  });
}

function startSortablePolling() {
  // 轮询直到 vxe-table 行渲染完成并成功创建 Sortable（弹窗首次打开时行渲染是异步的）
  let tries = 0;
  const tick = () => {
    const tbody = tableRef.value?.querySelector<HTMLElement>('.vxe-table--body tbody');
    if (tbody) {
      initSortable();
      pollTimer = null;
      return;
    }
    if (tries++ < 40) {
      pollTimer = window.setTimeout(tick, 50);
    }
  };
  tick();
}

watch(
  () => props.visible,
  val => {
    if (val) {
      currentScope.value = props.scope;
      pendingDrag = null;
      items.value = snapshot();
      startSortablePolling();
    } else {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
      sortableInstance?.destroy();
      sortableInstance = null;
    }
  }
);

/** 重置：恢复传入字段的原始名称与顺序，清空新增的自定义字段 */
function handleReset() {
  pendingDrag = null;
  customSeq = 0;
  items.value = snapshot();
  // 重置后行 DOM 会重建，下次打开前重建拖拽实例
  sortableInstance?.destroy();
  sortableInstance = null;
  startSortablePolling();
}

function handleCancel() {
  visible.value = false;
}

/** 把编辑行还原成导出字段：自定义字段按取值方式决定 key / 固定值 */
function toExportField(item: FieldItem): ExportField {
  const title = item.title?.trim() || item.key;
  if (item.custom) {
    return item.valueMode === 'fixed'
      ? { key: item.id, title, valueMode: 'fixed', fixedValue: item.fixedValue ?? '' }
      : { key: item.key?.trim() || item.id, title, valueMode: 'field' };
  }
  return {
    key: item.key,
    title,
    sourceType: item.sourceType,
    activeValue: item.activeValue,
    formatter: item.formatter
  };
}

function handleConfirm() {
  // 先应用本次拖拽结果，再按行顺序输出
  const ordered = items.value.slice();
  if (pendingDrag) {
    const { oldIndex, newIndex } = pendingDrag;
    const moved = ordered.splice(oldIndex, 1)[0];
    if (moved) {
      ordered.splice(newIndex, 0, moved);
    }
    pendingDrag = null;
  }
  emit('confirm', {
    scope: currentScope.value,
    fields: ordered.filter(item => item.checked).map(toExportField)
  });
}
</script>

<template>
  <NModal
    v-model:show="visible"
    :title="title ?? $t('common.exportFields')"
    preset="card"
    :bordered="false"
    style="width: 760px; height: 520px"
    content-style="display:flex;flex-direction:column;min-height:0;"
  >
    <div class="h-full w-full flex flex-col min-h-0">
      <div class="flex-y-center justify-between gap-12px pb-8px">
        <div class="flex-y-center gap-12px">
          <NButton size="small" type="primary" ghost @click="addField">
            <template #icon>
              <icon-mdi-plus class="text-icon" />
            </template>
            {{ $t('common.addField') }}
          </NButton>
          <template v-if="scopes?.length">
            <span class="text-14px">{{ $t('common.exportScope') }}</span>
            <NRadioGroup :value="currentScope" size="small" @update:value="handleScopeChange">
              <NRadioButton
                v-for="opt in scopes"
                :key="opt.value"
                :value="opt.value"
                :disabled="opt.disabled || loading"
                :title="opt.disabled ? opt.hint : undefined"
              >
                {{ opt.label }}
              </NRadioButton>
            </NRadioGroup>
          </template>
        </div>
        <span class="text-12px text-#909399">{{ $t('common.exportSelectedCount', { count: checkedCount }) }}</span>
      </div>
      <div ref="tableRef" class="w-full flex-1 min-h-0 field-config-dialog">
        <vxe-table
          :data="items"
          :border="true"
          :stripe="false"
          :row-config="{ isHover: true, height: 40 }"
          :column-config="{ resizable: true }"
          height="100%"
          show-overflow="tooltip"
          @after-render="initSortable"
        >
          <vxe-column :title="$t('common.drag')" :width="56" align="center">
            <template #default>
              <icon-mdi-drag class="rank-icon cursor-move text-icon" @mousedown.stop />
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.export')" :width="70" align="center">
            <template #header>
              <NCheckbox
                :checked="selectAllChecked"
                :indeterminate="selectAllIndeterminate"
                :disabled="items.length === 0"
                @update:checked="toggleSelectAll"
              />
            </template>
            <template #default="{ row }">
              <NCheckbox v-model:checked="row.checked" />
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.fieldName')" min-width="160">
            <template #default="{ row }">
              <NInput v-model:value="row.title" size="small" :placeholder="$t('common.fieldNamePlaceholder')" />
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.dataField')" min-width="160">
            <template #default="{ row }">
              <!-- 自定义字段：按取值方式填数据字段名或固定值；普通字段只读展示其取值 key -->
              <NInput
                v-if="row.custom && row.valueMode === 'field'"
                v-model:value="row.key"
                size="small"
                :placeholder="$t('common.dataFieldPlaceholder')"
              />
              <NInput
                v-else-if="row.custom"
                v-model:value="row.fixedValue"
                size="small"
                :placeholder="$t('common.fixedValuePlaceholder')"
              />
              <span v-else class="text-#909399">{{ row.key }}</span>
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.valueMode')" :width="120">
            <template #default="{ row }">
              <NSelect v-if="row.custom" v-model:value="row.valueMode" :options="valueModeOptions" size="small" />
              <span v-else class="text-#909399">{{ $t('common.valueModeField') }}</span>
            </template>
          </vxe-column>
          <vxe-column :title="$t('common.action')" :width="70" align="center">
            <template #default="{ row }">
              <NButton v-if="row.custom" size="small" quaternary type="error" text @click="removeField(row)">
                {{ $t('common.delete') }}
              </NButton>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton size="small" @click="handleReset">{{ $t('common.reset') }}</NButton>
        <NButton size="small" @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NButton size="small" type="primary" :disabled="checkedCount === 0" :loading="loading" @click="handleConfirm">
          {{ $t('common.export') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.field-config-dialog {
  :deep(.rank-icon) {
    cursor: move;
    font-size: 18px;
  }

  :deep(.sortable-drag) {
    background-color: rgb(240 249 255) !important;
  }

  :deep(.sortable-chosen) {
    background-color: rgb(240 253 244) !important;
  }
}
</style>
