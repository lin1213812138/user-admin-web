<script setup lang="ts">
import { $t } from '@/locales';
import { basicElements } from './basic-elements';
import { BUSINESS_FIELDS, type FieldDef } from './constant';
import { startDragGhost } from './drag-ghost';
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
  // 未落纸时（松手在纸张外）由 drag-ghost 把这一项动画送回原位
  startDragGhost(e, e.currentTarget as HTMLElement | null);
}
</script>

<template>
  <!--
 滚动条用组件库的 NScrollbar（与右侧属性面板、print-design 左侧面板一致）：
       内层 wrapper 承担 p-12px，让滚动条贴容器右边缘；NScrollbar 内部容器原生滚动但隐藏系统滚动条 
-->
  <NScrollbar class="h-full">
    <div class="p-12px">
      <!-- 业务字段在上、基础元素整组在下；两组条目同款：单列整行、左对齐灰字 -->
      <NCollapse :default-expanded-names="['fields', 'basic']" arrow-placement="right">
        <NCollapseItem name="fields">
          <template #header>
            <!-- flex-1 让箭头贴右（naive right placement 只给箭头 margin-left，标题需自身撑满） -->
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
        <NCollapseItem name="basic">
          <template #header>
            <span class="flex-1">{{ $t('page.manage.labelDesign.basicElements') }}</span>
          </template>
          <div class="flex flex-col gap-8px">
            <div
              v-for="item in basicElements"
              :key="item.type"
              class="cursor-grab rounded border border-#e5e7eb bg-white p-8px text-13px active:cursor-grabbing dark:border-#2a2a2a dark:bg-#1f1f1f"
              draggable="true"
              @dragstart="onDragStart($event, { kind: 'basic', type: item.type })"
            >
              <span class="text-#999 dark:text-#777">{{ $t(item.labelKey) }}</span>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </div>
  </NScrollbar>
</template>
