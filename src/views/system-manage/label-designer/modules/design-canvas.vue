<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { NDropdown } from 'naive-ui';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { PX_PER_MM, parsePaper } from './constant';
import ElementRenderer from './element-renderer.vue';
import { useCanvasInteraction } from './use-canvas-interaction';
import { basicElements } from './basic-elements';
import type { LabelElement, ElementType } from './types';

const store = useLabelDesignStore();
const paperRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const { begin } = useCanvasInteraction(paperRef);

const paper = computed(() => parsePaper(store.template.paperSize));
const paperStyle = computed(() => ({
  width: `${paper.value.w * PX_PER_MM}px`,
  height: `${paper.value.h * PX_PER_MM}px`,
  transform: `scale(${store.zoom})`
}));

const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

function elementStyle(el: LabelElement) {
  return {
    left: `${el.x * PX_PER_MM}px`,
    top: `${el.y * PX_PER_MM}px`,
    width: `${el.width * PX_PER_MM}px`,
    height: `${el.height * PX_PER_MM}px`
  };
}

const pan = ref({ x: 0, y: 0 });
let panning: { x: number; y: number; px: number; py: number } | null = null;

function onViewportPointerDown(e: PointerEvent) {
  if (e.button !== 0) return; // 仅左键平移/取消选中，右键留给菜单
  store.selectElement(null);
  panning = { x: pan.value.x, y: pan.value.y, px: e.clientX, py: e.clientY };
  window.addEventListener('pointermove', onPanMove);
  window.addEventListener('pointerup', onPanUp);
}
function onPanMove(e: PointerEvent) {
  if (!panning) return;
  pan.value = { x: panning.x + (e.clientX - panning.px), y: panning.y + (e.clientY - panning.py) };
}
function onPanUp() {
  panning = null;
  window.removeEventListener('pointermove', onPanMove);
  window.removeEventListener('pointerup', onPanUp);
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  store.setZoom(Number((store.zoom + delta).toFixed(2)));
}

// 右键菜单
const menu = ref({ show: false, x: 0, y: 0, elementId: null as string | null });

function openMenu(e: MouseEvent, elementId: string | null) {
  e.preventDefault();
  if (elementId) store.selectElement(elementId);
  menu.value = { show: true, x: e.clientX, y: e.clientY, elementId };
}
function closeMenu() {
  menu.value = { ...menu.value, show: false };
}

const menuOptions = computed(() => {
  const opts: Array<Record<string, unknown>> = [];
  if (menu.value.elementId) {
    opts.push(
      { label: '复制元素', key: 'duplicate' },
      { label: '删除', key: 'delete' },
      { type: 'divider' },
      { label: '上移一层', key: 'up' },
      { label: '下移一层', key: 'down' },
      { label: '置于顶层', key: 'front' },
      { label: '置于底层', key: 'back' },
      { type: 'divider' },
      { label: '复制到剪贴板', key: 'copy' }
    );
  }
  if (store.clipboard) {
    opts.push({ label: '粘贴', key: 'paste' });
  }
  return opts;
});

function onMenuSelect(key: string) {
  const id = menu.value.elementId;
  switch (key) {
    case 'duplicate':
      if (id) store.duplicateElement(id);
      break;
    case 'delete':
      if (id) store.removeElement(id);
      break;
    case 'up':
      if (id) store.moveLayer(id, 1);
      break;
    case 'down':
      if (id) store.moveLayer(id, -1);
      break;
    case 'front':
      if (id) store.bringToFront(id);
      break;
    case 'back':
      if (id) store.sendToBack(id);
      break;
    case 'copy':
      if (id) store.copyElement(id);
      break;
    case 'paste':
      store.pasteElement();
      break;
  }
  closeMenu();
}

interface DropPayload {
  kind: 'basic' | 'field';
  type?: ElementType;
  field?: string;
  sample?: string;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const raw = e.dataTransfer?.getData('application/x-label');
  if (!raw) return;
  let payload: DropPayload;
  try {
    payload = JSON.parse(raw) as DropPayload;
  } catch {
    return;
  }
  const size = parsePaper(store.template.paperSize);
  let x = 0;
  let y = 0;
  const paperEl = paperRef.value;
  if (paperEl) {
    const rect = paperEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x = ((e.clientX - rect.left) / rect.width) * size.w;
      y = ((e.clientY - rect.top) / rect.height) * size.h;
    }
  }
  if (payload.kind === 'basic' && payload.type) {
    const def = basicElements.find(b => b.type === payload.type);
    if (def) store.addElement(def, { x, y });
  } else if (payload.kind === 'field' && payload.field) {
    store.addElement(
      {
        type: 'text',
        labelKey: 'page.manage.labelDesign.basicText',
        defaultOptions: { field: payload.field, sample: payload.sample ?? payload.field }
      },
      { x, y }
    );
  }
}

onMounted(() => {
  viewportRef.value?.addEventListener('wheel', onWheel, { passive: false });
});
onBeforeUnmount(() => {
  viewportRef.value?.removeEventListener('wheel', onWheel);
});
</script>

<template>
  <div
    ref="viewportRef"
    class="label-designer-canvas relative flex-1 overflow-hidden bg-#f5f5f5 dark:bg-#1f1f1f"
    @pointerdown="onViewportPointerDown"
    @dragover.prevent
    @drop="onDrop"
  >
    <div
      class="absolute left-1/2 top-1/2 origin-center"
      :style="{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)` }"
    >
      <div v-if="store.showRuler" class="ruler ruler-top" :style="{ width: paperStyle.width }" />
      <div
        ref="paperRef"
        class="relative bg-white shadow-md"
        :class="{ 'label-grid': store.showGrid }"
        :style="paperStyle"
        @contextmenu.prevent="openMenu($event, null)"
      >
        <div
          v-for="el in store.elements"
          :key="el.id"
          class="absolute select-none"
          :class="{ 'is-selected': store.selectedId === el.id }"
          :style="elementStyle(el)"
          @pointerdown="begin($event, el.id, 'move')"
          @contextmenu.prevent.stop="openMenu($event, el.id)"
        >
          <ElementRenderer :element="el" class="h-full w-full" />
          <template v-if="store.selectedId === el.id">
            <div
              v-for="h in handles"
              :key="h"
              class="resize-handle"
              :class="`handle-${h}`"
              @pointerdown.stop="begin($event, el.id, 'resize', h)"
            />
          </template>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8px right-8px z-10 rounded bg-black/60 px-8px py-2px text-12px text-white">
      {{ Math.round(store.zoom * 100) }}%
    </div>

    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :x="menu.x"
      :y="menu.y"
      :show="menu.show"
      :options="menuOptions"
      @select="onMenuSelect"
      @clickoutside="closeMenu"
    />
  </div>
</template>

<style scoped>
.label-designer-canvas {
  touch-action: none;
}
.label-grid {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: calc(1mm) calc(1mm);
}
.is-selected {
  outline: 2px dashed var(--n-primary-color, #2080f0);
  outline-offset: 2px;
  z-index: 10;
}
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--n-primary-color, #2080f0);
  border: 1px solid #fff;
  border-radius: 1px;
  z-index: 5;
}
.handle-n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-e {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-w {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-ne {
  top: -4px;
  right: -4px;
  cursor: nesw-resize;
}
.handle-nw {
  top: -4px;
  left: -4px;
  cursor: nwse-resize;
}
.handle-se {
  bottom: -4px;
  right: -4px;
  cursor: nwse-resize;
}
.handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: nesw-resize;
}
.ruler {
  position: absolute;
  top: -16px;
  height: 16px;
  background-image: repeating-linear-gradient(
    to right,
    rgba(0, 0, 0, 0.35) 0,
    rgba(0, 0, 0, 0.35) 1px,
    transparent 1px,
    transparent 10px
  );
  background-size: 10px 100%;
}
</style>
