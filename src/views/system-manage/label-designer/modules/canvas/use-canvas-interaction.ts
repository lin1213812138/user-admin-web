import type { Ref } from 'vue';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { mmToPt, PX_PER_PT, parsePaper } from '../core/constant';

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
  /** 纸张尺寸的 pt 换算值（paperSize 本身是 mm，这里仅为与元素几何 pt 同单位比较），begin 时缓存一次；拖拽期间纸张不会变 */
  paperW: number;
  paperH: number;
  /** 最近一次真正写进 DOM 的几何：松手结算的唯一权威（= 用户最后看到的位置） */
  lastGeo: Geometry | null;
}

/** 屏幕像素 → pt 的换算（纸张仍是 mm，先转 pt；已含缩放，直接基于纸张实际渲染尺寸） */
function ptPerPx(paperEl: HTMLElement | null, paperSize: string): number {
  if (!paperEl) return 1 / PX_PER_PT;
  const rect = paperEl.getBoundingClientRect();
  const { w } = parsePaper(paperSize);
  if (rect.width <= 0) return 1 / PX_PER_PT;
  return mmToPt(w) / rect.width;
}

/** 纸张尺寸换算为 pt（元素几何单位），供纸界钳制使用 */
function paperPt(paperSize: string): { w: number; h: number } {
  const { w, h } = parsePaper(paperSize);
  return { w: mmToPt(w), h: mmToPt(h) };
}

/** 元素最小边长（pt）：与旧 mm 版的 2mm 手感一致 */
const MIN_SIDE = mmToPt(2);

/**
 * 纸界钳制（move 专用）：只动位置、不改尺寸，元素不允许被拖出纸张。
 * 上界取 max(0, 纸界 - 元素尺寸)——元素本身比纸张大时上限退化为 0（贴左/上边），仍允许溢出，
 * 与 resize 侧「尺寸上限取 max(原尺寸, 纸界余量)、不强制缩小」的约定一致。
 */
function clampInPaper(geo: Geometry, paperW: number, paperH: number): Geometry {
  const maxX = Math.max(0, paperW - geo.width);
  const maxY = Math.max(0, paperH - geo.height);
  return {
    x: Math.min(Math.max(geo.x, 0), maxX),
    y: Math.min(Math.max(geo.y, 0), maxY),
    width: geo.width,
    height: geo.height
  };
}

/**
 * 按手柄计算钳制后的目标几何，纯函数。
 * - 最小边长 MIN_SIDE；
 * - 纸界：e/s 手柄限制右/下边不越出纸张，w/n 手柄限制 x/y 不为负（等价 width/height 上限）；
 *   上限取 max(原尺寸, 纸界余量)：元素本来就比纸张大时不允许被强制缩小，只禁止继续变大；
 * - keepRatio 时角手柄锁定原始宽高比（以宽驱动高），高度受纸界限制时回推宽度以保持比例。
 */
function resizeGeometry(
  o: Geometry,
  handle: ResizeHandle,
  dxPt: number,
  dyPt: number,
  keepRatio: boolean,
  paperW: number,
  paperH: number
): Geometry {
  let { x, y, width, height } = o;
  const maxW = handle.includes('e')
    ? Math.max(o.width, paperW - o.x)
    : handle.includes('w')
      ? Math.max(o.width, o.x + o.width)
      : Number.POSITIVE_INFINITY;
  const maxH = handle.includes('s')
    ? Math.max(o.height, paperH - o.y)
    : handle.includes('n')
      ? Math.max(o.height, o.y + o.height)
      : Number.POSITIVE_INFINITY;

  if (handle.includes('e')) width = Math.min(Math.max(MIN_SIDE, o.width + dxPt), maxW);
  if (handle.includes('s')) height = Math.min(Math.max(MIN_SIDE, o.height + dyPt), maxH);
  if (handle.includes('w')) {
    width = Math.min(Math.max(MIN_SIDE, o.width - dxPt), maxW);
    x = o.x + (o.width - width);
  }
  if (handle.includes('n')) {
    height = Math.min(Math.max(MIN_SIDE, o.height - dyPt), maxH);
    y = o.y + (o.height - height);
  }
  // Shift 等比仅角手柄生效（handle 两字母）；边手柄单维缩放与比例无关
  if (keepRatio && handle.length === 2) {
    const ratio = o.width / o.height;
    height = Math.max(MIN_SIDE, width / ratio);
    // 等比高度超纸界时收敛高度并回推宽度，比例不破
    if (height > maxH) {
      height = maxH;
      width = Math.max(MIN_SIDE, height * ratio);
    }
    if (handle.includes('n')) y = o.y + (o.height - height);
    if (handle.includes('w')) x = o.x + (o.width - width);
  }
  return { x, y, width, height };
}

/**
 * 画布拖拽/缩放交互。
 * 高频帧完全脱离响应式：pointermove 只直写被拖元素 DOM 样式（rAF 合帧），
 * pointerup 才把最终几何一次性写回 store；真实拖动才产生撤销快照。
 * 预览与落库同源（都过 clampInPaper / resizeGeometry），松手不会跳变。
 */
export function useCanvasInteraction(paperEl: Ref<HTMLElement | null>) {
  const store = useLabelDesignStore();
  let drag: DragState | null = null;

  /** rAF 帧回调：算出目标几何，直写 DOM + 写拖动预览（仅驱动属性面板） */
  function applyFrame() {
    const d = drag;
    if (!d) return;
    d.rafId = 0;
    const dxPt = (d.px - d.startX) * d.ptPerPx;
    const dyPt = (d.py - d.startY) * d.ptPerPx;
    let geo: Geometry;
    if (d.mode === 'move') {
      geo = clampInPaper(
        { x: d.orig.x + dxPt, y: d.orig.y + dyPt, width: d.orig.width, height: d.orig.height },
        d.paperW,
        d.paperH
      );
      if (d.dom) {
        // 本地 px = pt * PX_PER_PT；translate 只走合成不触发 reflow
        d.dom.style.transform = `translate(${(geo.x - d.orig.x) * PX_PER_PT}px, ${(geo.y - d.orig.y) * PX_PER_PT}px)`;
      }
    } else {
      geo = resizeGeometry(d.orig, d.handle!, dxPt, dyPt, d.shift, d.paperW, d.paperH);
      if (d.dom) {
        d.dom.style.width = `${geo.width * PX_PER_PT}px`;
        d.dom.style.height = `${geo.height * PX_PER_PT}px`;
        d.dom.style.left = `${geo.x * PX_PER_PT}px`;
        d.dom.style.top = `${geo.y * PX_PER_PT}px`;
      }
    }
    d.lastGeo = geo;
    // 拖动预览只被属性面板消费，画布模板不依赖它，不会触发画布渲染
    store.dragPreview = geo;
  }

  /**
   * 清掉高频帧直写的样式，改按 store 权威值恢复定位——
   * 纯点击不写 store、Vue 不重渲染，只清不恢复会让元素丢失 left/top 飞到左上角。
   */
  function settleDom(d: DragState) {
    const dom = d.dom;
    if (!dom) return;
    const cur = store.elements.find(item => item.id === d.id);
    if (cur) {
      dom.style.left = `${cur.x * PX_PER_PT}px`;
      dom.style.top = `${cur.y * PX_PER_PT}px`;
      dom.style.width = `${cur.width * PX_PER_PT}px`;
      dom.style.height = `${cur.height * PX_PER_PT}px`;
    }
    dom.style.transform = '';
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
    /*
     * 结算一律取「最后一帧真正写进 DOM 的几何」d.lastGeo——它才是松手瞬间眼睛看到的位置。
     * 用 pointerup 坐标重算会与画面差一帧（最后一帧的 rAF 常被 cancelAnimationFrame 取消），
     * 且 pointerup 的 clientX/clientY 在部分环境下不可靠，会让落点偏移、甚至落到画布外。
     * d.lastGeo 为 null 只可能是整段拖拽一帧都没渲染（纯点击），此分支才用 pointerup 坐标兜底。
     */
    const geo: Geometry =
      d.lastGeo ??
      (d.mode === 'move'
        ? clampInPaper(
            { x: d.orig.x + dxPt, y: d.orig.y + dyPt, width: d.orig.width, height: d.orig.height },
            d.paperW,
            d.paperH
          )
        : resizeGeometry(d.orig, d.handle!, dxPt, dyPt, d.shift, d.paperW, d.paperH));
    // 仅真实拖动才结算，点击不产生 undo 记录（阈值 ≈ 旧 0.2mm 手感）；
    // 判定取自几何差值而非指针差值，resize 的边手柄只改宽高、x/y 不动也能被判为已拖动
    const movedEnough =
      Math.abs(geo.x - d.orig.x) +
        Math.abs(geo.y - d.orig.y) +
        Math.abs(geo.width - d.orig.width) +
        Math.abs(geo.height - d.orig.height) >
      mmToPt(0.2);
    if (movedEnough) {
      // 此时 store 仍是拖动前状态，先快照再写入
      store.snapshot();
      store.updateElement(d.id, geo);
    }
    settleDom(d);
  }

  function begin(e: PointerEvent, id: string, mode: 'move' | 'resize', handle?: ResizeHandle) {
    if (e.button !== 0) return; // 仅左键拖拽，右键留给菜单
    e.stopPropagation();
    const el = store.elements.find(item => item.id === id);
    if (!el) return;
    const dom = paperEl.value?.querySelector<HTMLElement>(`[data-id="${id}"]`) ?? null;
    // 纸界参数每帧都要用，begin 缓存一次（拖拽期间纸张尺寸不变）
    const { w: paperW, h: paperH } = paperPt(store.template.paperSize);
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
      paperW,
      paperH,
      dom,
      rafId: 0,
      shift: e.shiftKey,
      lastGeo: null
    };
    // 不设 will-change:transform——按下即提升合成层，非整数 px 高度（pt 换算）被栅格化舍入，
    // 视觉上元素瞬间矮 1~2px、松手才恢复；高频写 transform 时浏览器会自动提升合成层，无需预告
    store.selectElement(id);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return { begin };
}
