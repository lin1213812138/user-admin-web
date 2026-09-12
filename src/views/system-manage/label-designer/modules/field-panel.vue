<script setup lang="ts">
import { $t } from '@/locales';
import { basicElements } from './basic-elements';
import { BUSINESS_FIELDS, type FieldDef } from './constant';
import type { ElementType } from './types';

const props = withDefaults(
  defineProps<{
    fields?: FieldDef[];
  }>(),
  {
    fields: () => BUSINESS_FIELDS
  }
);

type DragPayload =
  | { kind: 'basic'; type: ElementType }
  | { kind: 'field'; field: string; sample?: string; title?: string; elementType?: ElementType; showTitle?: boolean };

function onDragStart(e: DragEvent, payload: DragPayload) {
  e.dataTransfer?.setData('application/x-label', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <div class="h-full overflow-auto p-12px">
    <NCollapse :default-expanded-names="['basic', 'fields']" arrow-placement="right">
      <NCollapseItem name="basic">
        <template #header>
          <!-- flex-1 让箭头贴右（naive right placement 只给箭头 margin-left，标题需自身撑满） -->
          <span class="flex-1">{{ $t('page.manage.labelDesign.basicElements') }}</span>
        </template>
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
      </NCollapseItem>
      <NCollapseItem name="fields">
        <template #header>
          <span class="flex-1">{{ $t('page.manage.labelDesign.fields') }}</span>
        </template>
        <div class="flex flex-col gap-8px">
          <div
            v-for="f in props.fields"
            :key="f.key"
            class="cursor-grab rounded border border-#e5e7eb bg-white p-8px text-13px active:cursor-grabbing dark:border-#2a2a2a dark:bg-#1f1f1f"
            draggable="true"
            @dragstart="
              onDragStart($event, {
                kind: 'field',
                field: f.key,
                sample: f.sample,
                title: f.title,
                elementType: f.elementType,
                showTitle: f.showTitle
              })
            "
          >
            <span class="text-#999 dark:text-#777">{{ f.label }}</span>
            <span class="ml-4px text-#bbb">{{ f.key }}</span>
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>
