<script setup lang="ts">
import { $t } from '@/locales';
import { defaultOptionsFor, defaultSize } from '@/store/modules/label-design';
import { basicElements } from '../core/basic-elements';
import { BUSINESS_FIELDS, type FieldDef } from '../core/constant';
import { beginDragPreview, startDragGhost } from '../canvas/drag-ghost';
import DragPreview from '../canvas/drag-preview.vue';
import type { ElementSeed, ElementType, LabelElement } from '../core/types';

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

/** 构建拖拽预览元素（默认尺寸与默认 options 均与拖入创建时同源，保证「预览 = 落纸后的样子」） */
function buildPreviewElement(type: ElementType, defaultOptions: ElementSeed): LabelElement {
  const size = defaultSize(type);
  return {
    id: '__preview__',
    type,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    options: defaultOptionsFor({ type, defaultOptions })
  };
}

/** 按下业务字段条目：立即显示该字段的真实渲染预览（不等浏览器判定 dragstart） */
function onEntryPointerDown(e: PointerEvent, f: FieldDef) {
  const type: ElementType = f.elementType ?? 'text';
  const element = buildPreviewElement(type, {
    field: f.key,
    sample: f.sample,
    title: f.title,
    showTitle: f.showTitle
  });
  beginDragPreview(e, e.currentTarget as HTMLElement | null, element);
}

/** 按下基础元素条目：同样立即显示真实渲染预览 */
function onBasicPointerDown(e: PointerEvent, type: ElementType, seed: ElementSeed) {
  beginDragPreview(e, e.currentTarget as HTMLElement | null, buildPreviewElement(type, seed));
}

function onDragStart(e: DragEvent, payload: DragPayload) {
  e.dataTransfer?.setData('application/x-label', JSON.stringify(payload));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  // 拖拽接管：顶掉原生影子、跟手与回位统一由 drag-ghost 处理
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
              class="field-entry flex cursor-move items-center rounded border border-#e5e7eb bg-white p-8px text-13px transition-colors hover:border-primary dark:border-#2a2a2a dark:hover:border-primary dark:bg-#1f1f1f"
              draggable="true"
              @pointerdown="onEntryPointerDown($event, f)"
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
              <!-- 拖拽把手图标：仅作「可拖出」的视觉提示，整条均可拖（与表格列配置的 icon-mdi-drag 同款） -->
              <icon-mdi-drag class="mr-6px shrink-0 text-14px text-#8c8c8c dark:text-#999" />
              <span class="entry-title text-#999 dark:text-#777">{{ f.label }}</span>
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
              class="field-entry flex cursor-move items-center rounded border border-#e5e7eb bg-white p-8px text-13px transition-colors hover:border-primary dark:border-#2a2a2a dark:hover:border-primary dark:bg-#1f1f1f"
              draggable="true"
              @pointerdown="onBasicPointerDown($event, item.type, item.defaultOptions)"
              @dragstart="onDragStart($event, { kind: 'basic', type: item.type })"
            >
              <icon-mdi-drag class="mr-6px shrink-0 text-14px text-#8c8c8c dark:text-#999" />
              <span class="entry-title text-#999 dark:text-#777">{{ $t(item.labelKey) }}</span>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </div>
  </NScrollbar>
  <!-- 拖拽预览：按下条目即显示该字段的真实渲染效果（组件内部 Teleport 到 body，位置由 drag-ghost 直写） -->
  <DragPreview />
</template>

<style scoped>
/*
 * hover 时条目名变主题色。用 scoped CSS 而非 UnoCSS 的 group-hover 变体：
 * group-hover:text-primary 在此场景下实测未生效（元素上已有 text-#999 / dark:text-#777，
 * 变体生成的优先级与源顺序不可控）。本选择器含 scoped 属性后特异性 (0,4,0)，
 * 稳定压过 text-#999(0,1,0) 与 dark:text-#777(0,2,0)。
 */
.field-entry:hover .entry-title {
  color: rgb(var(--primary-color, 32 128 240));
}
</style>
