import type { Ref } from 'vue';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { mmToPt, PX_PER_PT, parsePaper } from './constant';

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  id: string;
  mode: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  /** 最新指针位置：pointermove 只写入，rAF 帧内消费 */
  px: number;
  py: number;
  orig: Geometry;
  /** pt/屏幕px，begin 时缓存一次；getBoundingClientRect 强制 reflow，不能每帧调 */
  ptPerPx: number;
  /** 被拖元素 DOM，高频帧直写样式用 */
  dom: HTMLElement | null;
  rafId: number;
  /** Shift 实时状态：pointermove 每帧刷新，拖拽中途按/松立即切换等比模式 */
  shift: boolean;
}

/** 屏幕像素 → pt 的换算（纸张仍是 mm，先转 pt；已含缩放，直接基于纸张实际渲染尺寸） */
function ptPerPx(paperEl: HTMLElement | null, paperSize: string): number {
  if (!paperEl) return 1 / PX_PER_PT;
  const rect = paperEl.getBoundingClientRect();
  const { w } = parsePaper(paperSize);
  if (rect.width <= 0) return 1 / PX_PER_PT;
  return mmToPt(w) / rect.width;
}

/** 元素最小边长（pt）：与旧 mm 版的 2mm 手感一致 */
const MIN_SIDE = mmToPt(2);

/** 按手柄计算钳制后的目标几何（最小边长 MIN_SIDE），纯函数；keepRatio 时角手柄锁定原始宽高比（以宽驱动高） */
function resizeGeometry(o: Geometry, handle: ResizeHandle, dxPt: number, dyPt: number, keepRatio = false): Geometry {
  let { x, y, width, height } = o;
  if (handle.includes('e')) width = Math.max(MIN_SIDE, o.width + dxPt);
  if (handle.includes('s')) height = Math.max(MIN_SIDE, o.height + dyPt);
  if (handle.includes('w')) {
    width = Math.max(MIN_SIDE, o.width - dxPt);
    x = o.x + (o.width - width);
  }
  if (handle.includes('n')) {
    height = Math.max(MIN_SIDE, o.height - dyPt);
    y = o.y + (o.height - height);
  }
  // Shift 等比仅角手柄生效（handle 两字母）；边手柄单维缩放与比例无关
  if (keepRatio && handle.length === 2) {
    const ratio = o.width / o.height;
    height = Math.max(MIN_SIDE, width / ratio);
    if (handle.includes('n')) y = o.y + (o.height - height);
  }
  return { x, y, width, height };
}

/**
 * 画布拖拽/缩放交互。
 * 高频帧完全脱离响应式：pointermove 只直写被拖元素 DOM 样式（rAF 合帧），
 * pointerup 才把最终几何一次性写回 store；真实拖动才产生撤销快照。
 */
export function useCanvasInteraction(paperEl: Ref<HTMLElement | null>) {
  const store = useLabelDesignStore();
  let drag: DragState | null = null;

  /** rAF 帧回调：算出钳制后的目标几何，直写 DOM + 写拖动预览（仅驱动属性面板） */
  function applyFrame() {
    const d = drag;
    if (!d) return;
    d.rafId = 0;
    const dxPt = (d.px - d.startX) * d.ptPerPx;
    const dyPt = (d.py - d.startY) * d.ptPerPx;
    let geo: { x: number; y: number; width: number; height: number };
    if (d.mode === 'move') {
      geo = {
        x: Math.max(0, d.orig.x + dxPt),
        y: Math.max(0, d.orig.y + dyPt),
        width: d.orig.width,
        height: d.orig.height
      };
      if (d.dom) {
        // 本地 px = pt * PX_PER_PT；translate 只走合成不触发 reflow
        d.dom.style.transform = `translate(${(geo.x - d.orig.x) * PX_PER_PT}px, ${(geo.y - d.orig.y) * PX_PER_PT}px)`;
      }
    } else {
      geo = resizeGeometry(d.orig, d.handle!, dxPt, dyPt, d.shift);
      if (d.dom) {
        d.dom.style.width = `${geo.width * PX_PER_PT}px`;
        d.dom.style.height = `${geo.height * PX_PER_PT}px`;
        d.dom.style.left = `${geo.x * PX_PER_PT}px`;
        d.dom.style.top = `${geo.y * PX_PER_PT}px`;
      }
    }
    // 拖动预览只被属性面板消费，画布模板不依赖它，不会触发画布渲染
    store.dragPreview = geo;
  }

  function onPointerMove(e: PointerEvent) {
    const d = drag;
    if (!d) return;
    d.px = e.clientX;
    d.py = e.clientY;
    d.shift = e.shiftKey;
    if (!d.rafId) d.rafId = requestAnimationFrame(applyFrame);
  }

  function onPointerUp(e: PointerEvent) {
    const d = drag;
    drag = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (!d) return;
    if (d.rafId) {
      cancelAnimationFrame(d.rafId);
      d.rafId = 0;
    }
    store.dragPreview = null;
    const dxPt = (e.clientX - d.startX) * d.ptPerPx;
    const dyPt = (e.clientY - d.startY) * d.ptPerPx;
    // 仅真实拖动才记撤销点与写回，点击不产生 undo 记录（阈值 ≈ 旧 0.2mm 手感）
    if (Math.abs(dxPt) + Math.abs(dyPt) > mmToPt(0.2)) {
      let patch: Geometry;
      if (d.mode === 'move') {
        patch = {
          x: Math.max(0, d.orig.x + dxPt),
          y: Math.max(0, d.orig.y + dyPt),
          width: d.orig.width,
          height: d.orig.height
        };
      } else {
        patch = resizeGeometry(d.orig, d.handle!, dxPt, dyPt, d.shift);
      }
      // 此时 store 仍是拖动前状态，先快照再写入
      store.snapshot();
      store.updateElement(d.id, patch);
    }
    if (d.dom) {
      // 清掉高频帧直写的合成类样式；定位类键随即按 store 权威值恢复——
      // 纯点击不写 store、Vue 不会重渲染，只清不恢复会让元素丢失 left/top 飞到左上角
      const cur = store.elements.find(item => item.id === d.id);
      if (cur) {
        d.dom.style.left = `${cur.x * PX_PER_PT}px`;
        d.dom.style.top = `${cur.y * PX_PER_PT}px`;
        d.dom.style.width = `${cur.width * PX_PER_PT}px`;
        d.dom.style.height = `${cur.height * PX_PER_PT}px`;
      }
      d.dom.style.transform = '';
    }
  }

  function begin(e: PointerEvent, id: string, mode: 'move' | 'resize', handle?: ResizeHandle) {
    if (e.button !== 0) return; // 仅左键拖拽，右键留给菜单
    e.stopPropagation();
    const el = store.elements.find(item => item.id === id);
    if (!el) return;
    const dom = paperEl.value?.querySelector<HTMLElement>(`[data-id="${id}"]`) ?? null;
    drag = {
      id,
      mode,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      px: e.clientX,
      py: e.clientY,
      orig: { x: el.x, y: el.y, width: el.width, height: el.height },
      ptPerPx: ptPerPx(paperEl.value, store.template.paperSize),
      dom,
      rafId: 0,
      shift: e.shiftKey
    };
    // 不设 will-change:transform——按下即提升合成层，非整数 px 高度（pt 换算）被栅格化舍入，
    // 视觉上元素瞬间矮 1~2px、松手才恢复；高频写 transform 时浏览器会自动提升合成层，无需预告
    store.selectElement(id);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return { begin };
}
