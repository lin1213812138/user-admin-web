import { BACK_MS, backRemain } from './constant';

/**
 * 左侧面板拖拽项的「未落纸回落」动画。
 *
 * 原生 HTML5 拖拽的影子（drag image）由浏览器绘制与销毁，JS 既拿不到也没法对它做动画；
 * 而画布 onDrop 落在整个灰底视口上、且第一步就 preventDefault（= 接受拖放），
 * 即使落点在纸张外、后面直接 return 不创建元素，浏览器也认为拖放已被接受，
 * 于是松手时不会播放任何回位过程，直接把影子抹掉 —— 用户看到的就是「松手直接消失」。
 *
 * 这里不去动原生影子（跟手与透明度仍由浏览器保证），只在 dragend 时按松手位置克隆一份幻影，
 * 用 rAF 补间把它平移回源项原位；拖拽期间临时接管 document 级 dragover/drop，
 * 让每个落点都算「已接受」，避免浏览器自己再播一次回位动画（双重动画）。
 */

/** 幻影落纸后的淡出时长（ms） */
const FADE_MS = 120;
/** 面板项拖拽时写入的 payload 类型，用于识别「本次拖拽是不是本模块发起的」 */
const DRAG_TYPE = 'application/x-label';
const GHOST_Z_INDEX = '3000';

interface DragGhostState {
  /** 源项（面板里的那一格），回落终点 */
  sourceEl: HTMLElement;
  /** 抓取时指针相对源项左上角的偏移：让幻影停在「原本跟着手的位置」 */
  offsetX: number;
  offsetY: number;
  /** 最近一次 dragover 的指针位置 */
  pointerX: number;
  pointerY: number;
  /** 本次拖拽是否已在画布创建元素（画布 drop 一定早于 dragend） */
  created: boolean;
}

let state: DragGhostState | null = null;
let ghostEl: HTMLElement | null = null;
let ghostRaf = 0;

/** 只处理本模块发起的拖拽：其它拖放（如表格列拖拽）一律不插手 */
function isOurDrag(e: DragEvent) {
  const types = e.dataTransfer?.types;
  return !!types && Array.from(types).includes(DRAG_TYPE);
}

/**
 * 拖拽期间把每个落点都变成「已接受」。
 * preventDefault 即「接受拖放」——这样浏览器不会自己播回位动画，回位动画的唯一来源是本模块的幻影；
 * dropEffect 与 dragstart 里的 effectAllowed('copy') 保持一致，光标角标不变。
 */
function onDocDragOver(e: DragEvent) {
  if (!state || !isOurDrag(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  state.pointerX = e.clientX;
  state.pointerY = e.clientY;
}

/** 落在非画布区域（面板 / 工具栏 / 页面外）也会走到这里：只吞默认行为，是否创建元素由画布 onDrop 决定 */
function onDocDrop(e: DragEvent) {
  if (!state || !isOurDrag(e)) return;
  e.preventDefault();
}

function onWindowDragEnd() {
  endDragGhost();
}

/** 摘掉拖拽期间挂上的临时监听（capture 阶段，否则内部 stopPropagation 会漏掉事件） */
function unbind() {
  document.removeEventListener('dragover', onDocDragOver, true);
  document.removeEventListener('drop', onDocDrop, true);
  window.removeEventListener('dragend', onWindowDragEnd, true);
}

/** 造一份与源项同尺寸的幻影，摆到松手位置；与原生影子同帧交接，不闪 */
function createGhost(s: DragGhostState): HTMLElement | null {
  const rect = s.sourceEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const ghost = s.sourceEl.cloneNode(true) as HTMLElement;
  const { style } = ghost;
  style.position = 'fixed';
  style.left = `${s.pointerX - s.offsetX}px`;
  style.top = `${s.pointerY - s.offsetY}px`;
  style.width = `${rect.width}px`;
  style.height = `${rect.height}px`;
  style.margin = '0';
  style.pointerEvents = 'none';
  style.zIndex = GHOST_Z_INDEX;
  style.transformOrigin = 'top left';
  document.body.appendChild(ghost);
  return ghost;
}

/** 清掉当前幻影与未完成的补间 */
function clearGhost() {
  if (ghostRaf) {
    cancelAnimationFrame(ghostRaf);
    ghostRaf = 0;
  }
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
}

/**
 * 未落纸：逐帧把幻影平移回源项原位。
 * 时间轴 0 点取「首个 rAF 帧的时间戳」而不是 performance.now()：dragend 之后主线程可能被打断，
 * 用墙钟会让首帧进度直接跨过一大截、动画被压成瞬移（画布回弹那边踩过同一个坑）。
 * 注意 `backRemain` 返回的是「剩余比例」（1=起点），幻影要的是「已走完的比例」，
 * 所以取 `1 - backRemain(t)`；直接用 backRemain 会让首帧瞬间跳到原位、再倒着飘回落点。
 */
function flyBack(ghost: HTMLElement, s: DragGhostState) {
  const from = ghost.getBoundingClientRect();
  const target = s.sourceEl.isConnected ? s.sourceEl.getBoundingClientRect() : from;
  const dx = target.left - from.left;
  const dy = target.top - from.top;
  if (Math.abs(dx) + Math.abs(dy) < 0.5) {
    clearGhost();
    return;
  }
  let t0 = -1;
  const step = (now: number) => {
    ghostRaf = 0;
    if (t0 < 0) t0 = now;
    const t = Math.min(1, Math.max(0, (now - t0) / BACK_MS));
    if (t >= 1) {
      clearGhost();
      return;
    }
    const progress = 1 - backRemain(t);
    ghost.style.transform = `translate(${dx * progress}px, ${dy * progress}px)`;
    ghostRaf = requestAnimationFrame(step);
  };
  ghostRaf = requestAnimationFrame(step);
}

/** 已落纸（元素已创建）：幻影快速淡出，避免与新建元素双影 */
function fadeOut(ghost: HTMLElement) {
  ghost.style.transition = `opacity ${FADE_MS}ms linear`;
  ghost.style.opacity = '0';
  window.setTimeout(() => {
    if (ghostEl === ghost) clearGhost();
  }, FADE_MS + 40);
}

/** 拖拽开始：记录源项与抓取偏移，接管 document 级拖放事件 */
export function startDragGhost(e: DragEvent, sourceEl: HTMLElement | null) {
  if (!sourceEl) return;
  // 上一次动画还没收尾（连续快速拖拽）：先清干净，避免两个幻影同时补间
  clearGhost();
  const rect = sourceEl.getBoundingClientRect();
  state = {
    sourceEl,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    pointerX: e.clientX,
    pointerY: e.clientY,
    created: false
  };
  document.addEventListener('dragover', onDocDragOver, true);
  document.addEventListener('drop', onDocDrop, true);
  window.addEventListener('dragend', onWindowDragEnd, true);
}

/** 画布成功创建元素时调用（drop 一定早于 dragend） */
export function markDragCreated() {
  if (state) state.created = true;
}

/** 拖拽结束：未落纸则回落原位，已落纸则淡出；同时摘掉所有临时监听 */
export function endDragGhost() {
  const s = state;
  state = null;
  unbind();
  if (!s) return;
  const ghost = createGhost(s);
  if (!ghost) return;
  ghostEl = ghost;
  if (s.created) {
    fadeOut(ghost);
    return;
  }
  flyBack(ghost, s);
}
