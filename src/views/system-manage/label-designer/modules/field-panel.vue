<script setup lang="ts">
import { $t } from '@/locales';
import { basicElements } from './basic-elements';
import type { ElementType } from './types';

interface FieldDef {
  key: string;
  label: string;
  /** 拖到画布时直接作为「文本」显示的示例值 */
  sample?: string;
}

const props = withDefaults(
  defineProps<{
    fields?: FieldDef[];
  }>(),
  {
    fields: () => [
      { key: 'orderNo', label: '单号', sample: 'WM202609070001' },
      { key: 'sku', label: 'SKU', sample: 'SKU-882910' },
      { key: 'goodsName', label: '商品名称', sample: '无线蓝牙耳机' },
      { key: 'qty', label: '数量', sample: '100' },
      { key: 'batch', label: '批次', sample: 'B20260907' },
      { key: 'warehouse', label: '仓库', sample: '上海仓' },
      { key: 'date', label: '日期', sample: '2026-09-07' }
    ]
  }
);

type DragPayload = { kind: 'basic'; type: ElementType } | { kind: 'field'; field: string; sample?: string };

function onDragStart(e: DragEvent, payload: DragPayload) {
  e.dataTransfer?.setData('application/x-label', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <div class="flex h-full flex-col gap-12px overflow-auto p-12px">
    <div>
      <div class="mb-8px text-13px font-medium text-#666 dark:text-#aaa">
        {{ $t('page.manage.labelDesign.basicElements') }}
      </div>
      <div class="grid grid-cols-2 gap-8px">
        <div
          v-for="item in basicElements"
          :key="item.type"
          class="cursor-grab rounded border border-#e5e7eb bg-white p-8px text-center text-13px active:cursor-grabbing dark:border-#2a2a2a dark:bg-#1f1f1f"
          draggable="true"
          @dragstart="onDragStart($event, { kind: 'basic', type: item.type })"
        >
          {{ $t(item.labelKey) }}
        </div>
      </div>
    </div>

    <div>
      <div class="mb-8px text-13px font-medium text-#666 dark:text-#aaa">
        {{ $t('page.manage.labelDesign.fields') }}
      </div>
      <div class="flex flex-col gap-8px">
        <div
          v-for="f in props.fields"
          :key="f.key"
          class="cursor-grab rounded border border-#e5e7eb bg-white p-8px text-13px active:cursor-grabbing dark:border-#2a2a2a dark:bg-#1f1f1f"
          draggable="true"
          @dragstart="onDragStart($event, { kind: 'field', field: f.key, sample: f.sample })"
        >
          <span class="text-#999 dark:text-#777">{{ f.label }}</span>
          <span class="ml-4px text-#bbb">{{ f.key }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
