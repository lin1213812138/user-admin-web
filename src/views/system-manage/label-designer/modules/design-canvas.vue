<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { NDropdown } from 'naive-ui';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { mmToPt, PX_PER_MM, PX_PER_PT, parsePaper } from './constant';
import ElementRenderer from './element-renderer.vue';
import { useCanvasInteraction } from './use-canvas-interaction';
import { basicElements } from './basic-elements';
import type { LabelElement, ElementType } from './types';

const store = useLabelDesignStore();
const paperRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const { begin } = useCanvasInteraction(paperRef);

const paper = computed(() => parsePaper(store.template.paperSize));
// 缩放用 CSS zoom（布局级缩放）而非 transform scale：scale 是合成层缩放，非整数倍率下描边横向/纵向
// 栅格化舍入不同，hover/选中框线会出现横竖粗细不一；zoom 由布局引擎统一栅格化，线宽一致且文字更清晰
const paperStyle = computed(() => ({
  width: `${paper.value.w * PX_PER_MM}px`,
  height: `${paper.value.h * PX_PER_MM}px`,
  zoom: store.zoom
}));

const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

function elementStyle(el: LabelElement) {
  return {
    left: `${el.x * PX_PER_PT}px`,
    top: `${el.y * PX_PER_PT}px`,
    width: `${el.width * PX_PER_PT}px`,
    height: `${el.height * PX_PER_PT}px`
  };
}

const panRef = ref<HTMLElement | null>(null);
const pan = ref({ x: 0, y: 0 });
let panning: { x: number; y: number; px: number; py: number } | null = null;
let panPending: { x: number; y: number } | null = null;
let panRaf = 0;

/** 平移 rAF 帧回调：直写容器 transform，不碰响应式 */
function applyPanFrame() {
  panRaf = 0;
  if (panPending && panRef.value) {
    panRef.value.style.transform = `translate(-50%, -50%) translate(${panPending.x}px, ${panPending.y}px)`;
  }
}

function onViewportPointerDown(e: PointerEvent) {
  if (e.button !== 0) return; // 仅左键平移/取消选中，右键留给菜单
  store.selectElement(null);
  panning = { x: pan.value.x, y: pan.value.y, px: e.clientX, py: e.clientY };
  panPending = { x: panning.x, y: panning.y };
  window.addEventListener('pointermove', onPanMove);
  window.addEventListener('pointerup', onPanUp);
}
function onPanMove(e: PointerEvent) {
  if (!panning) return;
  panPending = { x: panning.x + (e.clientX - panning.px), y: panning.y + (e.clientY - panning.py) };
  if (!panRaf) panRaf = requestAnimationFrame(applyPanFrame);
}
function onPanUp() {
  if (panRaf) {
    cancelAnimationFrame(panRaf);
    panRaf = 0;
  }
  // 平移高频帧直写 DOM，松手才写回响应式（与元素拖拽同策略）
  if (panning && panPending) pan.value = panPending;
  panning = null;
  panPending = null;
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

/** 业务字段允许拖入的元素类型及对应文案 key（文本类 + 条码/二维码） */
const FIELD_TYPE_LABEL_KEYS = {
  text: 'page.manage.labelDesign.basicText',
  longText: 'page.manage.labelDesign.basicLongText',
  barcode: 'page.manage.labelDesign.basicBarcode',
  qrcode: 'page.manage.labelDesign.basicQrcode'
} as const;

type FieldElementType = keyof typeof FIELD_TYPE_LABEL_KEYS;

const FIELD_ELEMENT_TYPES = Object.keys(FIELD_TYPE_LABEL_KEYS) as FieldElementType[];

interface DropPayload {
  kind: 'basic' | 'field';
  type?: ElementType;
  field?: string;
  sample?: string;
  title?: string;
  /** 业务字段拖入时的元素类型（来自 FieldDef.elementType） */
  elementType?: ElementType;
  /** 业务字段拖入时是否显示标题（来自 FieldDef.showTitle） */
  showTitle?: boolean;
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
      // 落点比例 × 纸张物理尺寸（mm），再换算为元素几何单位 pt
      x = mmToPt(((e.clientX - rect.left) / rect.width) * size.w);
      y = mmToPt(((e.clientY - rect.top) / rect.height) * size.h);
    }
  }
  if (payload.kind === 'basic' && payload.type) {
    const def = basicElements.find(b => b.type === payload.type);
    if (def) store.addElement(def, { x, y });
  } else if (payload.kind === 'field' && payload.field) {
    // 业务字段按字段定义的 elementType 创建（设置什么类型就是什么类型），未设置/不支持时回退 text
    const fieldType = (FIELD_ELEMENT_TYPES as string[]).includes(payload.elementType ?? '')
      ? (payload.elementType as FieldElementType)
      : 'text';
    store.addElement(
      {
        type: fieldType,
        labelKey: FIELD_TYPE_LABEL_KEYS[fieldType],
        defaultOptions: {
          field: payload.field,
          sample: payload.sample ?? payload.field,
          title: payload.title,
          showTitle: payload.showTitle
        }
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
    :style="{ '--canvas-zoom': store.zoom }"
    @pointerdown="onViewportPointerDown"
    @dragover.prevent
    @drop="onDrop"
  >
    <div
      ref="panRef"
      class="absolute left-1/2 top-1/2 origin-center"
      :style="{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)` }"
    >
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
          :data-id="el.id"
          class="element-item absolute select-none"
          :class="{ 'is-selected': store.selectedId === el.id }"
          :style="elementStyle(el)"
          @pointerdown="begin($event, el.id, 'move')"
          @contextmenu.prevent.stop="openMenu($event, el.id)"
        >
          <ElementRenderer :element="el" class="h-full w-full" />
          <div v-if="store.selectedId === el.id" class="selection-box" />
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
/* hover 提示可交互：细虚线，不显示缩放手柄（仅选中态渲染手柄）。
   outline 贴元素边界（offset 0）消除外扩空隙观感差；线宽除以 canvas-zoom 补偿，
   使缩放后描边恒为 1/2 设备像素，横向与竖向粗细一致 */
.element-item:not(.is-selected):hover {
  outline: calc(1px / var(--canvas-zoom, 1)) dashed var(--n-primary-color, #2080f0);
  outline-offset: 0;
}
.is-selected {
  outline: calc(1px / var(--canvas-zoom, 1)) solid var(--n-primary-color, #2080f0);
  outline-offset: 0;
  z-index: 10;
}
/* 缩放手柄：6px 实心主题色小方块，与描边同色连成一体。
   对齐：贴边描边（offset 0）宽 1px/zoom，中心线在盒外 0.5px/zoom；
   手柄 6px，定位 = -(3 + 0.5/zoom)px 使手柄中心恰好落在描边中心线上（zoom=1 时即 -3.5px） */
.resize-handle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--n-primary-color, #2080f0);
  border-radius: 1px;
  z-index: 5;
}
.handle-n {
  top: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  left: 50%;
  width: 10px; /* 边中点手柄沿边方向拉长，更好命中 */
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-s {
  bottom: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  left: 50%;
  width: 10px;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-e {
  right: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  top: 50%;
  height: 10px; /* 左右手柄纵向拉长 */
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-w {
  left: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  top: 50%;
  height: 10px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-ne {
  top: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  right: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  cursor: nesw-resize;
}
.handle-nw {
  top: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  left: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  cursor: nwse-resize;
}
.handle-se {
  bottom: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  right: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  cursor: nwse-resize;
}
.handle-sw {
  bottom: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  left: calc(-3px - 0.5px / var(--canvas-zoom, 1));
  cursor: nesw-resize;
}
</style>
