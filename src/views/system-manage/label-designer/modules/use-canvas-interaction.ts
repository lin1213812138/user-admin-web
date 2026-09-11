import { ref, type Ref } from 'vue';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { PX_PER_MM, parsePaper } from './constant';

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  orig: { x: number; y: number; width: number; height: number };
  moved: boolean;
}

/** 屏幕像素 → mm 的换算（已含缩放，直接基于纸张实际渲染尺寸） */
function mmPerPx(paperEl: HTMLElement | null, paperSize: string): number {
  if (!paperEl) return 1 / (PX_PER_MM * 1);
  const rect = paperEl.getBoundingClientRect();
  const { w } = parsePaper(paperSize);
  if (rect.width <= 0) return 1 / PX_PER_MM;
  return w / rect.width;
}

export function useCanvasInteraction(paperEl: Ref<HTMLElement | null>) {
  const store = useLabelDesignStore();
  const drag = ref<DragState | null>(null);

  function onPointerMove(e: PointerEvent) {
    const d = drag.value;
    if (!d) return;
    const mpp = mmPerPx(paperEl.value, store.template.paperSize);
    const dx = (e.clientX - d.startX) * mpp;
    const dy = (e.clientY - d.startY) * mpp;
    if (Math.abs(dx) + Math.abs(dy) > 0.2) d.moved = true;
    if (d.mode === 'move') {
      store.updateElement(d.id, { x: Math.max(0, d.orig.x + dx), y: Math.max(0, d.orig.y + dy) });
    } else {
      resize(d.id, d.handle!, d.orig, dx, dy);
    }
  }

  function onPointerUp() {
    if (drag.value?.moved) {
      // 拖拽产生的变更已在 move 中直接写入，撤销点已在 start 时记录
    }
    drag.value = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  function resize(id: string, handle: ResizeHandle, o: DragState['orig'], dx: number, dy: number) {
    let { x, y, width, height } = o;
    if (handle.includes('e')) width = Math.max(2, o.width + dx);
    if (handle.includes('s')) height = Math.max(2, o.height + dy);
    if (handle.includes('w')) {
      width = Math.max(2, o.width - dx);
      x = o.x + (o.width - width);
    }
    if (handle.includes('n')) {
      height = Math.max(2, o.height - dy);
      y = o.y + (o.height - height);
    }
    store.updateElement(id, { x, y, width, height });
  }

  function begin(e: PointerEvent, id: string, mode: 'move' | 'resize', handle?: ResizeHandle) {
    if (e.button !== 0) return; // 仅左键拖拽，右键留给菜单
    e.stopPropagation();
    const el = store.elements.find(item => item.id === id);
    if (!el) return;
    store.snapshot();
    store.selectElement(id);
    drag.value = {
      id,
      mode,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: el.x, y: el.y, width: el.width, height: el.height },
      moved: false
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return { begin };
}
