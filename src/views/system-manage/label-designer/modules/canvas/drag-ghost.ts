import { nextTick, ref } from 'vue';
import { BACK_MS, PX_PER_PT, backRemain } from '../core/constant';
import type { LabelElement } from '../core/types';

/**
 * 左侧面板字段/基础元素的「按下即显示的真实渲染预览」+ 拖拽跟手 + 未落纸回落。
 *
 * 会话从 pointerdown 开始（预览立即出现，不等浏览器判定 dragstart），到 pointerup（只是点击 →
 * 预览立即收起）或 dragend（拖拽结束 → 已落纸淡出 / 未落纸补间飞回源项）结束。
 *
 * 两点浏览器行为需要迁就：
 * - 原生拖拽影子会被浏览器强制叠一层半透明，与落纸/回位时的预览观感不一致，故用 1×1 透明图
 *   顶掉它，跟手完全由本模块的预览 DOM 负责；
 * - HTML5 拖拽期间 pointermove / pointerup 都不触发，位置跟手改由 document 级 dragover 驱动，
 *   且 dragstart 时必须摘掉 pointerup 的「点击判定」监听，否则它会残留到下一次点击才触发。
 */

/** 预览落纸后的淡出时长（ms） */
const FADE_MS = 120;
/** 面板项拖拽时写入的 payload 类型，用于识别「本次拖拽是不是本模块发起的」 */
const DRAG_TYPE = 'application/x-label';

/** 1×1 透明图：顶掉原生影子（模块加载时即预载，避免 dragstart 里现取现用来不及解码） */
const transparentPixel = new Image();
transparentPixel.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface DragSession {
  /** 源条目（面板里的那一格），未落纸时回落的终点 */
  sourceEl: HTMLElement;
  /** 抓取时指针相对源项左上角的偏移：预览与落纸元素都按「指针 − 偏移」对齐 */
  grabX: number;
  grabY: number;
  /** 最近一次指针位置（客户端坐标） */
  pointerX: number;
  pointerY: number;
  /** 是否已在画布创建元素（画布 drop 一定早于 dragend） */
  created: boolean;
  /** 是否已进入原生拖拽（dragstart 触发）：用于区分「点击」与「拖拽」 */
  dragging: boolean;
  /** 预览实测高度（pt）：文本类「高度按内容自适应」落纸用；未测到为 null */
  previewHeight: number | null;
}

let session: DragSession | null = null;
/** 预览渲染的元素（null = 不显示）；drag-preview.vue 据此渲染真实内容 */
export const previewElement = ref<LabelElement | null>(null);
/** 预览容器 DOM（组件挂载时注册；位置直写 style，不走响应式） */
let previewEl: HTMLElement | null = null;
/** 回位补间的 rAF 句柄 */
let previewRaf = 0;
/** 按下时挂的 pointerup 监听（点击判定用；dragstart 时必须摘掉） */
let pendingPointerUp: (() => void) | null = null;

/** 预览容器挂载/卸载回调（drag-preview.vue 通过模板 ref 注入） */
export function registerPreviewEl(el: HTMLElement | null) {
  previewEl = el;
  // 容器可能晚于首次定位才挂载（等 nextTick），挂载后立即按当前指针补一次定位
  if (el) syncPreviewPosition();
}

/** 只处理本模块发起的拖拽：其它拖放（如表格列拖拽）一律不插手 */
function isOurDrag(e: DragEvent) {
  const types = e.dataTransfer?.types;
  return !!types && Array.from(types).includes(DRAG_TYPE);
}

/** 把预览摆到「当前指针 − 抓取偏移」处（与 onDrop 换算元素位置的公式一致） */
function syncPreviewPosition() {
  if (!previewEl || !session) return;
  previewEl.style.left = `${session.pointerX - session.grabX}px`;
  previewEl.style.top = `${session.pointerY - session.grabY}px`;
}

function movePreviewTo(clientX: number, clientY: number) {
  if (!session) return;
  session.pointerX = clientX;
  session.pointerY = clientY;
  syncPreviewPosition();
}

function removePendingPointerUp() {
  if (pendingPointerUp) {
    window.removeEventListener('pointerup', pendingPointerUp);
    window.removeEventListener('pointercancel', pendingPointerUp);
    pendingPointerUp = null;
  }
}

/** 摘掉拖拽期间挂上的临时监听（capture 阶段，否则内部 stopPropagation 会漏掉事件） */
function unbind() {
  document.removeEventListener('dragover', onDocDragOver, true);
  document.removeEventListener('drop', onDocDrop, true);
  window.removeEventListener('dragend', onWindowDragEnd, true);
}

/**
 * 拖拽期间把每个落点都变成「已接受」，同时让预览跟手。
 * preventDefault 即「接受拖放」——这样浏览器不会自己播回位动画，回位动画的唯一来源是本模块；
 * dropEffect 与 dragstart 里的 effectAllowed('copy') 保持一致，光标角标不变。
 */
function onDocDragOver(e: DragEvent) {
  if (!session || !isOurDrag(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  movePreviewTo(e.clientX, e.clientY);
}

/** 落在非画布区域（面板 / 工具栏 / 页面外）也会走到这里：只吞默认行为，是否创建元素由画布 onDrop 决定 */
function onDocDrop(e: DragEvent) {
  if (!session || !isOurDrag(e)) return;
  e.preventDefault();
}

function onWindowDragEnd() {
  endDragGhost();
}

/** 立即收起预览并结束会话 */
function destroyPreview() {
  if (previewRaf) {
    cancelAnimationFrame(previewRaf);
    previewRaf = 0;
  }
  previewElement.value = null;
  session = null;
}

/**
 * 未落纸：逐帧把预览平移回源项原位。
 * 时间轴 0 点取「首个 rAF 帧的时间戳」而不是 performance.now()：dragend 之后主线程可能被打断，
 * 用墙钟会让首帧进度直接跨过一大截、动画被压成瞬移（画布回弹那边踩过同一个坑）。
 * 注意 `backRemain` 返回的是「剩余比例」（1=起点），预览要的是「已走完的比例」，
 * 所以取 `1 - backRemain(t)`；直接用 backRemain 会让首帧瞬间跳到原位、再倒着飘回落点。
 */
function flyBackPreview(s: DragSession) {
  const el = previewEl;
  if (!el) {
    destroyPreview();
    return;
  }
  const from = el.getBoundingClientRect();
  const target = s.sourceEl.isConnected ? s.sourceEl.getBoundingClientRect() : from;
  const dx = target.left - from.left;
  const dy = target.top - from.top;
  if (Math.abs(dx) + Math.abs(dy) < 0.5) {
    destroyPreview();
    return;
  }
  let t0 = -1;
  const step = (now: number) => {
    previewRaf = 0;
    if (t0 < 0) t0 = now;
    const t = Math.min(1, Math.max(0, (now - t0) / BACK_MS));
    if (t >= 1) {
      destroyPreview();
      return;
    }
    const progress = 1 - backRemain(t);
    el.style.transform = `translate(${dx * progress}px, ${dy * progress}px)`;
    previewRaf = requestAnimationFrame(step);
  };
  previewRaf = requestAnimationFrame(step);
}

/** 已落纸（元素已创建）：预览快速淡出，避免与新建元素双影 */
function fadeOutPreview() {
  const el = previewEl;
  if (!el) {
    destroyPreview();
    return;
  }
  el.style.transition = `opacity ${FADE_MS}ms linear`;
  el.style.opacity = '0';
  window.setTimeout(() => {
    // 期间若已开始新的拖拽会话，容器引用已换，不能误清新的预览
    if (previewEl === el) destroyPreview();
  }, FADE_MS + 40);
}

/**
 * 按下条目：立即显示该字段/元素的真实渲染预览（内容由 drag-preview.vue 复用画布渲染器渲染），
 * 并挂上「点击判定」监听（抬起时若未进入原生拖拽，视为点击 → 预览立即收起）。
 */
export async function beginDragPreview(e: PointerEvent, sourceEl: HTMLElement | null, element: LabelElement) {
  if (!sourceEl || e.button !== 0) return;
  destroyPreview();
  const rect = sourceEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  session = {
    sourceEl,
    grabX: e.clientX - rect.left,
    grabY: e.clientY - rect.top,
    pointerX: e.clientX,
    pointerY: e.clientY,
    created: false,
    dragging: false,
    previewHeight: null
  };
  previewElement.value = element;
  // 容器要等 Teleport 渲染完才有 DOM；不足一帧，无感
  await nextTick();
  syncPreviewPosition();
  // 预览已渲染：实测内容自然高度（pt），供「文本高度按内容自适应」落纸时使用
  if (session && previewEl) session.previewHeight = previewEl.offsetHeight / PX_PER_PT;

  const onUp = () => {
    removePendingPointerUp();
    if (!session || !session.dragging) destroyPreview();
  };
  pendingPointerUp = onUp;
  window.addEventListener('pointerup', onUp);
  // 指针被系统/浏览器收回时不会走 pointerup，兜底同款收尾
  window.addEventListener('pointercancel', onUp);
}

/** 进入原生拖拽（dragstart）：顶掉原生影子、摘掉点击监听、接管 document 级 dragover/drop */
export function startDragGhost(e: DragEvent, sourceEl: HTMLElement | null) {
  if (!session || !sourceEl) return;
  session.dragging = true;
  // HTML5 拖拽期间 pointerup 不会触发：必须摘掉点击判定监听，否则会残留到下一次点击
  removePendingPointerUp();
  if (e.dataTransfer) e.dataTransfer.setDragImage(transparentPixel, 0, 0);
  document.addEventListener('dragover', onDocDragOver, true);
  document.addEventListener('drop', onDocDrop, true);
  window.addEventListener('dragend', onWindowDragEnd, true);
}

/** 画布成功创建元素时调用（drop 一定早于 dragend） */
export function markDragCreated() {
  if (session) session.created = true;
}

/** 当前拖拽的抓取偏移（指针相对源项左上角）；供画布 onDrop 把元素创建在「预览所在位置」 */
export function getDragOffset(): { x: number; y: number } {
  return session ? { x: session.grabX, y: session.grabY } : { x: 0, y: 0 };
}

/** 预览实测高度（pt）：文本类型落纸时按它设置元素高度（内容自适应）；未测到返回 null */
export function getPreviewHeight(): number | null {
  return session?.previewHeight ?? null;
}

/** 拖拽结束（dragend）：未落纸则原地回位，已落纸则淡出；同时摘掉所有临时监听 */
export function endDragGhost() {
  const s = session;
  unbind();
  removePendingPointerUp();
  if (!s) return;
  if (s.created) {
    fadeOutPreview();
    return;
  }
  flyBackPreview(s);
}
