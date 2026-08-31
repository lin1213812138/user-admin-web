<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import Sortable from 'sortablejs';
import { $t } from '@/locales';
import type { VxeColumnConfig, VxeColumnRenderColumn } from './use-vxe-table';

defineOptions({
  name: 'TableColumnConfig'
});

interface Props {
  visible: boolean;
  columns: VxeColumnConfig[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'update:columns', columns: VxeColumnConfig[]): void;
  (e: 'confirm'): void;
  (e: 'reset'): void;
}

const emit = defineEmits<Emits>();

const innerVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

// 本地副本：打开时从 props 拷贝，拖拽/编辑只改这里，确认后才写回
const localColumns = ref<VxeColumnConfig[]>([]);

const tableRef = ref<HTMLElement>();
let sortableInstance: Sortable | null = null;
// 拖拽结果暂存：onEnd 只记录索引，确认时才应用到数据，避免拖拽过程中 vxe-table 重绘跳动
let pendingDrag: { oldIndex: number; newIndex: number } | null = null;

const tableColumns = computed<VxeColumnRenderColumn[]>(() => [
  { key: 'drag', title: $t('common.drag'), width: 60, align: 'center' },
  { key: 'visible', title: $t('common.show'), width: 70, align: 'center' },
  { key: 'title', title: $t('common.name'), minWidth: 120 },
  { key: 'width', title: $t('common.width'), minWidth: 110 },
  { key: 'minWidth', title: $t('common.minWidth'), minWidth: 110 },
  { key: 'fixed', title: $t('common.fixed'), minWidth: 110 },
  { key: 'sortable', title: $t('common.sortable'), width: 80, align: 'center' }
]);

const fixedOptions = computed(() => [
  { label: $t('common.unFixed'), value: '' },
  { label: $t('common.fixedLeft'), value: 'left' },
  { label: $t('common.fixedRight'), value: 'right' }
]);

function initSortable() {
  if (sortableInstance) return; // 已创建则跳过，避免拖拽中被重建打断
  const tbody = tableRef.value?.querySelector<HTMLElement>('.vxe-table--body tbody');
  if (!tbody) {
    return;
  }

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
      // 只移动 DOM（Sortable 已完成），暂不更新响应式数据，避免 vxe-table 重绘导致跳动。
      // 真正的数据顺序在 handleConfirm 时按 oldIndex/newIndex 应用。
      pendingDrag = { oldIndex: evt.oldIndex, newIndex: evt.newIndex };
    }
  });
}

function handleConfirm() {
  // 应用拖拽顺序（若本次会话拖拽过）
  if (pendingDrag) {
    const list = localColumns.value.slice();
    const { oldIndex, newIndex } = pendingDrag;
    const moved = list.splice(oldIndex, 1)[0];
    list.splice(newIndex, 0, moved);
    localColumns.value = list;
    pendingDrag = null;
  }
  // 确认时才写回父组件（业务表格与缓存按此结果更新）
  emit('update:columns', jsonClone(localColumns.value));
  emit('confirm');
  innerVisible.value = false;
}

function handleReset() {
  // 重置为初始状态
  pendingDrag = null;
  localColumns.value = jsonClone(props.columns);
  emit('reset');
}

let pollTimer: number | null = null;

function startSortablePolling() {
  // 轮询直到 vxe-table 行渲染完成并成功创建 Sortable（避免因异步渲染时机导致拖拽失效）
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

watch(innerVisible, val => {
  if (val) {
    // 打开时从 props 拷贝到本地
    pendingDrag = null;
    localColumns.value = jsonClone(props.columns);
    startSortablePolling();
  } else {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    sortableInstance?.destroy();
    sortableInstance = null;
  }
});
</script>

<template>
  <NModal
    v-model:show="innerVisible"
    :title="$t('common.columnSetting')"
    preset="card"
    :bordered="false"
    style="width: 50%; height: 600px"
    content-style="display:flex;flex-direction:column;min-height:0;"
  >
    <div ref="tableRef" class="w-full flex-1 min-h-0 table-config-dialog">
      <Table
        :columns="tableColumns"
        :data="localColumns"
        :border="true"
        :stripe="false"
        :pagination="null"
        @after-render="initSortable"
      >
        <template #drag>
          <icon-mdi-drag class="rank-icon cursor-move text-icon" @mousedown.stop />
        </template>
        <template #visible="{ row }">
          <NSwitch v-model:value="row.visible" />
        </template>
        <template #title="{ row }">
          <span class="truncate">{{ row.title }}</span>
        </template>
        <template #width="{ row }">
          <NInputNumber v-model:value="row.width" :placeholder="$t('common.width')" size="small" :min="0" />
        </template>
        <template #minWidth="{ row }">
          <NInputNumber v-model:value="row.minWidth" :placeholder="$t('common.minWidth')" size="small" :min="0" />
        </template>
        <template #fixed="{ row }">
          <NSelect v-model:value="row.fixed" :options="fixedOptions" size="small" />
        </template>
        <template #sortable="{ row }">
          <NSwitch v-model:value="row.sortable" />
        </template>
      </Table>
    </div>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
        <NButton type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.table-config-dialog {
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
