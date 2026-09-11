# 标签设计器自研（替代 vue-plugin-hiprint）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用纯数据驱动的 Vue 组件树完全替代 `vue-plugin-hiprint`，实现标签设计器（拖入/选中/移动/缩放/属性面板/预览打印/撤销重做），仅引入 `bwip-js` 做条码二维码渲染。

**Architecture:** 模板是一份可序列化 JSON（`LabelTemplate`，mm 坐标）。画布是 JSON 的渲染，属性面板改 JSON，预览由 JSON 生成静态 HTML。状态用 Pinia Setup Store（`label-design`）统一管理 + 快照式撤销重做。所有画布交互用 pointer 事件手写，零额外 DOM 库。

**Tech Stack:** Vue 3.5 `<script setup>` + TypeScript 6 + Naive UI + Pinia 3 + `bwip-js`（条码/二维码）+ UnoCSS。依赖管理用 pnpm。

## Global Constraints

- 只用 **pnpm**，禁止 npm/yarn。
- 禁止 `any`；类型声明在 `src/typings/api/*.d.ts` 的 `Api.<Module>` 命名空间下或本模块 `types.ts`，必要时 `unknown` + 类型守卫。
- 禁止硬编码文案，一律 i18n（`zh-cn.ts` / `en-us.ts` / `typings/app.d.ts` 同步）。
- 禁止手写路由表 / 手改 `src/router/elegant/**`、`typings/elegant-router.d.ts`、`typings/components.d.ts`。
- Pinia store id 取自 `src/enum/index.ts` 的 `SetupStoreId` 枚举，禁止硬编码字符串。
- 逻辑单位统一 **mm**；`PX_PER_MM = 96 / 25.4`（≈3.7795）。
- 格式：`pnpm fmt`（oxfmt，2 空格、单引号、无尾随逗号、单参箭头省略括号）；改完必跑 `pnpm typecheck` / `pnpm lint` / `pnpm build`。
- 禁止自动 `git commit`（遵守项目 git 安全规则），由各任务在需要时提示用户提交。
- 原 `print-design`（hiprint 版）目录**保持不变**。本方案新建独立目录 `label-designer`，elegant-router 自动生成路由 `system-manage_label-designer`，与原 print-design 并存、互不干扰（用户明确要求不修改现有组件）。

---

## 文件结构

**新建**

- `src/views/system-manage/label-designer/modules/types.ts` — 数据模型
- `src/views/system-manage/label-designer/modules/barcode.ts` — bwip-js 封装（canvas 绘制 + dataURL）
- `src/views/system-manage/label-designer/modules/use-canvas-interaction.ts` — pointer 交互（拖放/选中/移动/缩放）
- `src/views/system-manage/label-designer/modules/element-renderer.vue` — 画布态按 type 渲染
- `src/views/system-manage/label-designer/modules/render-element-html.ts` — 预览/打印态 HTML 生成
- `src/views/system-manage/label-designer/modules/design-canvas.vue` — 纸张+标尺+网格+元素+交互
- `src/views/system-manage/label-designer/modules/property-panel.vue` — FormWrap 属性面板
- `src/views/system-manage/label-designer/modules/field-panel.vue` — 原生 draggable 字段面板
- `src/views/system-manage/label-designer/modules/preview-modal.vue` — 静态 HTML 预览打印
- `src/views/system-manage/label-designer/index.vue` — 编排（新建，全新组件）
- `src/store/modules/label-design/index.ts` — Pinia Setup Store

**改写**

- `src/views/system-manage/label-designer/modules/tool-bar.vue` — 加撤销/重做按钮
- `src/views/system-manage/label-designer/modules/basic-elements.ts` — 新建，描述结构 `{ type, labelKey, defaultOptions }`
- `src/typings/api/print-format.d.ts` — `designJson` 注释更新
- `src/enum/index.ts` — `SetupStoreId` 增加 `LabelDesign`
- `src/locales/langs/zh-cn.ts` / `en-us.ts` / `src/typings/app.d.ts` — 新增文案键
- `build/plugins/router.ts` — `onRouteMetaGen` 取消该路由 `hideInMenu`（测试用）

**依赖保留（用户明确要求不删除）**

- `vue-plugin-hiprint`、`jquery`、`@types/jquery` 继续保留在 `package.json`，不执行 `pnpm remove`。
- `src/typings/hiprint.d.ts` 保留。
- `vite.config.ts` 的 `optimizeDeps.include` 两项保留。
- 说明：新自研代码不 import hiprint/jQuery，故它们不会被打进新设计器产物；保留仅是不删除既有依赖。

---

## Task 1: 数据模型与基础描述

**Files:**

- Create: `src/views/system-manage/label-designer/modules/types.ts`
- Modify: `src/views/system-manage/label-designer/modules/basic-elements.ts`
- Modify: `src/enum/index.ts`（追加 `LabelDesign` 枚举值）

**Interfaces:**

- 产出：`ElementType`、`LabelElement`、`LabelTemplate`、`TextOptions`、`ImageOptions`、`BarcodeOptions`、`QrcodeOptions`、`RectOptions`、`LineOptions`、`ElementOptions`、`ElementDescriptor`（拖拽落点描述）、类型守卫 `isTextOptions` 等。

- [ ] **Step 1: 写 `types.ts`**

```ts
export type ElementType = 'text' | 'longText' | 'image' | 'barcode' | 'qrcode' | 'rect' | 'hline' | 'vline';

export interface BaseOptions {
  field?: string;
  testData?: string;
}

export interface TextOptions extends BaseOptions {
  text?: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface ImageOptions extends BaseOptions {
  src?: string;
}

export interface BarcodeOptions extends BaseOptions {
  symbology: 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca';
  displayValue: boolean;
  fontSize: number;
}

export interface QrcodeOptions extends BaseOptions {
  ecc: 'L' | 'M' | 'Q' | 'H';
}

export interface RectOptions {
  borderWidth: number;
  borderColor: string;
  bgColor: string;
  radius: number;
}

export interface LineOptions {
  borderWidth: number;
  borderColor: string;
}

export type ElementOptions = TextOptions | ImageOptions | BarcodeOptions | QrcodeOptions | RectOptions | LineOptions;

export interface LabelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  options: ElementOptions;
}

export interface LabelTemplate {
  paperSize: string;
  elements: LabelElement[];
}

/** 拖拽落点携带的描述（来自左侧面板 dataTransfer） */
export interface ElementDescriptor {
  type: ElementType;
  field?: string;
  testData?: string;
  sample?: string;
}

export function isTextOptions(o: ElementOptions): o is TextOptions {
  return 'fontSize' in o && 'align' in o;
}
export function isBarcodeOptions(o: ElementOptions): o is BarcodeOptions {
  return 'symbology' in o;
}
export function isQrcodeOptions(o: ElementOptions): o is QrcodeOptions {
  return 'ecc' in o;
}
export function isRectOptions(o: ElementOptions): o is RectOptions {
  return 'bgColor' in o;
}
export function isLineOptions(o: ElementOptions): o is LineOptions {
  return 'borderColor' in o && !('bgColor' in o) && !('fontSize' in o);
}
export function isImageOptions(o: ElementOptions): o is ImageOptions {
  return 'src' in o || (o as Record<string, unknown>).hasOwnProperty('src');
}
```

- [ ] **Step 2: 写 `basic-elements.ts`（替代原 hiprint tid 描述）**

```ts
import type { ElementDescriptor, ElementType } from './types';

export interface BasicElementDef {
  type: ElementType;
  labelKey: App.I18n.I18nKey;
  /** 拖入时创建的默认 options（不含坐标/尺寸/field） */
  defaultOptions: Omit<ElementDescriptor, 'type'>;
}

export const basicElements: BasicElementDef[] = [
  { type: 'text', labelKey: 'page.manage.labelDesign.basicText', defaultOptions: { sample: '' } },
  { type: 'longText', labelKey: 'page.manage.labelDesign.basicLongText', defaultOptions: { sample: '' } },
  { type: 'image', labelKey: 'page.manage.labelDesign.basicImage', defaultOptions: { sample: '' } },
  { type: 'barcode', labelKey: 'page.manage.labelDesign.basicBarcode', defaultOptions: { sample: '123456' } },
  {
    type: 'qrcode',
    labelKey: 'page.manage.labelDesign.basicQrcode',
    defaultOptions: { sample: 'https://example.com' }
  },
  { type: 'rect', labelKey: 'page.manage.labelDesign.basicRect', defaultOptions: {} },
  { type: 'hline', labelKey: 'page.manage.labelDesign.basicHline', defaultOptions: {} },
  { type: 'vline', labelKey: 'page.manage.labelDesign.basicVline', defaultOptions: {} }
];
```

- [ ] **Step 3: `src/enum/index.ts` 的 `SetupStoreId` 增加 `LabelDesign: 'label-design'`**（沿用现有枚举写法，避免破坏其它成员）

- [ ] **Step 4: 验证**
      Run: `pnpm typecheck`
      Expected: PASS（无其它引用前可能有未使用告警，可在最终统一处理）

---

## Task 2: Pinia 状态管理（含撤销重做）

**Files:**

- Create: `src/store/modules/label-design/index.ts`
- Modify: `src/typings/api/print-format.d.ts`（`designJson` 注释改为「自研标签模板 JSON 字符串」）

**Interfaces:**

- 依赖：Task 1 的 `LabelTemplate` / `LabelElement` / `ElementDescriptor`。
- 产出：`useLabelDesignStore()` 及成员：`template`、`selectedId`、`zoom`、`showGrid`、`showRuler`、`past`、`future`、`paperW/mm`、`addElement`、`updateElement`、`updateElementOptions`、`removeElement`、`selectElement`、`setPaper`、`setZoom`、`undo`、`redo`、`canUndo`、`canRedo`、`loadFromJson`、`toJson`、`reset`。

- [ ] **Step 1: 写 store**

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SetupStoreId } from '@/enum';
import type {
  ElementDescriptor,
  LabelElement,
  LabelTemplate
} from '@/views/system-manage/label-designer/modules/types';

function uid(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultOptionsFor(desc: ElementDescriptor): LabelElement['options'] {
  switch (desc.type) {
    case 'text':
    case 'longText':
      return {
        fontSize: 12,
        color: '#000000',
        fontWeight: 'normal',
        align: 'left',
        lineHeight: 1.2,
        field: desc.field,
        testData: desc.testData,
        text: desc.sample
      };
    case 'image':
      return { field: desc.field, testData: desc.testData, src: desc.sample };
    case 'barcode':
      return { symbology: 'code128', displayValue: true, fontSize: 10, field: desc.field, testData: desc.testData };
    case 'qrcode':
      return { ecc: 'M', field: desc.field, testData: desc.testData };
    case 'rect':
      return { borderWidth: 1, borderColor: '#000000', bgColor: 'transparent', radius: 0 };
    case 'hline':
    case 'vline':
      return { borderWidth: 1, borderColor: '#000000' };
  }
}

function defaultSize(type: ElementDescriptor['type']): { width: number; height: number } {
  switch (type) {
    case 'text':
      return { width: 40, height: 8 };
    case 'longText':
      return { width: 50, height: 16 };
    case 'image':
      return { width: 20, height: 20 };
    case 'barcode':
      return { width: 50, height: 15 };
    case 'qrcode':
      return { width: 20, height: 20 };
    case 'rect':
      return { width: 30, height: 20 };
    case 'hline':
      return { width: 40, height: 2 };
    case 'vline':
      return { width: 2, height: 40 };
  }
}

export const useLabelDesignStore = defineStore(SetupStoreId.LabelDesign, () => {
  const template = ref<LabelTemplate>({ paperSize: '100×150mm', elements: [] });
  const selectedId = ref<string | null>(null);
  const zoom = ref(1);
  const showGrid = ref(true);
  const showRuler = ref(true);
  const past = ref<LabelElement[][]>([]);
  const future = ref<LabelElement[][]>([]);

  const elements = computed(() => template.value.elements);
  const selected = computed(() => elements.value.find(e => e.id === selectedId.value) ?? null);
  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  function clone(list: LabelElement[]): LabelElement[] {
    return JSON.parse(JSON.stringify(list)) as LabelElement[];
  }

  function commit() {
    past.value.push(clone(elements.value));
    if (past.value.length > 50) past.value.shift();
    future.value = [];
  }

  function addElement(desc: ElementDescriptor, at: { x: number; y: number }) {
    commit();
    const size = defaultSize(desc.type);
    const el: LabelElement = {
      id: uid(),
      type: desc.type,
      x: at.x,
      y: at.y,
      width: size.width,
      height: size.height,
      options: defaultOptionsFor(desc)
    };
    elements.value.push(el);
    selectedId.value = el.id;
  }

  function updateElement(id: string, patch: Partial<Pick<LabelElement, 'x' | 'y' | 'width' | 'height'>>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    Object.assign(el, patch);
  }

  function updateElementOptions(id: string, patch: Record<string, unknown>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    el.options = { ...el.options, ...patch } as LabelElement['options'];
  }

  function removeElement(id: string) {
    commit();
    template.value.elements = elements.value.filter(e => e.id !== id);
    if (selectedId.value === id) selectedId.value = null;
  }

  function selectElement(id: string | null) {
    selectedId.value = id;
  }

  function setPaper(size: string) {
    template.value.paperSize = size;
  }

  function setZoom(next: number) {
    zoom.value = Math.min(4, Math.max(0.2, Number(next.toFixed(2))));
  }

  function undo() {
    if (!past.value.length) return;
    future.value.push(clone(elements.value));
    template.value.elements = past.value.pop()!;
  }

  function redo() {
    if (!future.value.length) return;
    past.value.push(clone(elements.value));
    template.value.elements = future.value.pop()!;
  }

  function loadFromJson(json: string) {
    if (!json) {
      template.value = { paperSize: '100×150mm', elements: [] };
      return;
    }
    try {
      const parsed = JSON.parse(json) as LabelTemplate;
      template.value = parsed && Array.isArray(parsed.elements) ? parsed : { paperSize: '100×150mm', elements: [] };
    } catch {
      template.value = { paperSize: '100×150mm', elements: [] };
    }
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  function toJson(): string {
    return JSON.stringify(template.value);
  }

  function reset() {
    template.value = { paperSize: '100×150mm', elements: [] };
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  return {
    template,
    selectedId,
    zoom,
    showGrid,
    showRuler,
    past,
    future,
    elements,
    selected,
    canUndo,
    canRedo,
    addElement,
    updateElement,
    updateElementOptions,
    removeElement,
    selectElement,
    setPaper,
    setZoom,
    undo,
    redo,
    loadFromJson,
    toJson,
    reset
  };
});
```

- [ ] **Step 2: 更新 `src/typings/api/print-format.d.ts` 中 `designJson` 注释为「自研标签模板 JSON 字符串」**

- [ ] **Step 3: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 3: 条码/二维码渲染（bwip-js）

**Files:**

- Create: `src/views/system-manage/label-designer/modules/barcode.ts`
- 依赖安装: `pnpm add bwip-js`（PowerShell 下若被 node-safe-delete-shim 拦截，先 `$env:NODE_OPTIONS=""`）

**Interfaces:**

- 产出：`renderBarcode(canvas, opts)`、`barcodeToDataURL(opts)`、`renderQrcode(canvas, opts)`、`qrcodeToDataURL(opts)`。
- 参数类型：`{ value: string; symbology?: BarcodeOptions['symbology']; displayValue?: boolean; fontSize?: number; ecc?: QrcodeOptions['ecc'] }`。

- [ ] **Step 1: 安装依赖**
      Run: `pnpm add bwip-js`
      Expected: 写入 `package.json` dependencies。

- [ ] **Step 2: 写 `barcode.ts`**

```ts
import bwipjs from 'bwip-js';

export interface BarcodeDrawOptions {
  value: string;
  symbology?: 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca';
  displayValue?: boolean;
  fontSize?: number;
}

export interface QrcodeDrawOptions {
  value: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
}

function draw(canvas: HTMLCanvasElement, opts: bwipjs.ToBufferOptions): void {
  try {
    bwipjs.toCanvas(canvas, opts);
  } catch {
    // 编码失败（如非法字符）时清空，由调用方决定占位
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function renderBarcode(canvas: HTMLCanvasElement, opts: BarcodeDrawOptions): void {
  draw(canvas, {
    bcid: opts.symbology ?? 'code128',
    text: opts.value || ' ',
    scale: 3,
    height: 10,
    includetext: opts.displayValue ?? true,
    textsize: opts.fontSize ?? 10
  });
}

export function renderQrcode(canvas: HTMLCanvasElement, opts: QrcodeDrawOptions): void {
  draw(canvas, {
    bcid: 'qrcode',
    text: opts.value || ' ',
    scale: 4,
    ecclevel: (opts.ecc ?? 'M').toLowerCase()
  });
}

export function barcodeToDataURL(opts: BarcodeDrawOptions): string {
  const canvas = document.createElement('canvas');
  renderBarcode(canvas, opts);
  return canvas.toDataURL('image/png');
}

export function qrcodeToDataURL(opts: QrcodeDrawOptions): string {
  const canvas = document.createElement('canvas');
  renderQrcode(canvas, opts);
  return canvas.toDataURL('image/png');
}
```

> `bwip-js` 浏览器入口默认导出含 `toCanvas`。若打包报错，改用 `import { toCanvas } from 'bwip-js'`（按实际包版本核对）。

- [ ] **Step 3: 验证**
      Run: `pnpm typecheck`
      Expected: PASS（如 `ToBufferOptions` 类型名不符，改为 `bwipjs.ToBufferOptions` 实际导出名或 `Record<string, unknown>`）

---

## Task 4: 元素渲染（画布态 + 预览 HTML）

**Files:**

- Create: `src/views/system-manage/label-designer/modules/element-renderer.vue`
- Create: `src/views/system-manage/label-designer/modules/render-element-html.ts`

**Interfaces:**

- 依赖：Task 1 `types`、`print-fields.ts` 的 `buildSampleData`、`barcode.ts`。
- 产出：`element-renderer.vue`（`props: element: LabelElement; data: Record<string,string> = {}`，按 type 渲染）；`renderElementHtml(el, data): string`、`buildPreviewHtml(template, data): string`、`resolveDisplayValue(el, data): string`。

- [ ] **Step 1: 写 `render-element-html.ts`**

```ts
import type { LabelElement, LabelTemplate } from './types';
import { barcodeToDataURL, qrcodeToDataURL } from './barcode';
import {
  isBarcodeOptions,
  isImageOptions,
  isLineOptions,
  isQrcodeOptions,
  isRectOptions,
  isTextOptions
} from './types';

export function resolveDisplayValue(el: LabelElement, data: Record<string, string>): string {
  const opt = el.options;
  if (opt.field && data[opt.field] != null && data[opt.field] !== '') return data[opt.field];
  if ('testData' in opt && opt.testData) return opt.testData;
  if (isTextOptions(opt) && opt.text) return opt.text;
  if (isImageOptions(opt) && opt.src) return opt.src;
  return '';
}

function stylePx(n: number): string {
  return `${n}mm`;
}

export function renderElementHtml(el: LabelElement, data: Record<string, string>): string {
  const left = stylePx(el.x);
  const top = stylePx(el.y);
  const w = stylePx(el.width);
  const h = stylePx(el.height);
  const base = `position:absolute;left:${left};top:${top};width:${w};height:${h};box-sizing:border-box;overflow:hidden;`;
  const opt = el.options;

  if (isTextOptions(opt)) {
    const value = resolveDisplayValue(el, data);
    const align = opt.align;
    return `<div style="${base}font-size:${opt.fontSize}pt;color:${opt.color};font-weight:${opt.fontWeight};text-align:${align};line-height:${opt.lineHeight};white-space:pre-wrap;word-break:break-all;">${escapeHtml(value)}</div>`;
  }
  if (isImageOptions(opt)) {
    const src = resolveDisplayValue(el, data);
    return `<img src="${src}" style="${base}object-fit:contain;" />`;
  }
  if (isBarcodeOptions(opt)) {
    const value = resolveDisplayValue(el, data) || ' ';
    const url = barcodeToDataURL({
      value,
      symbology: opt.symbology,
      displayValue: opt.displayValue,
      fontSize: opt.fontSize
    });
    return `<img src="${url}" style="${base}object-fit:contain;" />`;
  }
  if (isQrcodeOptions(opt)) {
    const value = resolveDisplayValue(el, data) || ' ';
    const url = qrcodeToDataURL({ value, ecc: opt.ecc });
    return `<img src="${url}" style="${base}object-fit:contain;" />`;
  }
  if (isRectOptions(opt)) {
    return `<div style="${base}border:${opt.borderWidth}px solid ${opt.borderColor};background:${opt.bgColor};border-radius:${opt.radius}px;"></div>`;
  }
  if (isLineOptions(opt)) {
    const isH = el.height <= el.width;
    const style = isH
      ? `border-top:${opt.borderWidth}px solid ${opt.borderColor};`
      : `border-left:${opt.borderWidth}px solid ${opt.borderColor};`;
    return `<div style="${base}${style}"></div>`;
  }
  return '';
}

export function buildPreviewHtml(template: LabelTemplate, data: Record<string, string>): string {
  const size = template.paperSize;
  const body = template.elements.map(el => renderElementHtml(el, data)).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>html,body{margin:0;padding:0}@page{size:${size};margin:0}</style></head><body><div style="position:relative;width:${size};height:${size};">${body}</div></body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
```

- [ ] **Step 2: 写 `element-renderer.vue`**（画布态，复用同一样式逻辑）

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { LabelElement } from './types';
import {
  isBarcodeOptions,
  isImageOptions,
  isLineOptions,
  isQrcodeOptions,
  isRectOptions,
  isTextOptions
} from './types';
import { renderBarcode, renderQrcode } from './barcode';

const props = defineProps<{ element: LabelElement; data?: Record<string, string> }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

function displayValue(): string {
  const opt = props.element.options;
  const data = props.data ?? {};
  if (opt.field && data[opt.field]) return data[opt.field];
  if ('testData' in opt && opt.testData) return opt.testData;
  if (isTextOptions(opt) && opt.text) return opt.text;
  if (isImageOptions(opt) && opt.src) return opt.src;
  return '';
}

const styleObject = computed(() => {
  const el = props.element;
  const opt = el.options;
  const base: Record<string, string> = {
    position: 'absolute',
    left: `${el.x}mm`,
    top: `${el.y}mm`,
    width: `${el.width}mm`,
    height: `${el.height}mm`,
    boxSizing: 'border-box',
    overflow: 'hidden'
  };
  if (isTextOptions(opt)) {
    Object.assign(base, {
      fontSize: `${opt.fontSize}pt`,
      color: opt.color,
      fontWeight: opt.fontWeight,
      textAlign: opt.align,
      lineHeight: String(opt.lineHeight),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all'
    });
  } else if (isRectOptions(opt)) {
    Object.assign(base, {
      border: `${opt.borderWidth}px solid ${opt.borderColor}`,
      background: opt.bgColor,
      borderRadius: `${opt.radius}px`
    });
  } else if (isLineOptions(opt)) {
    const isH = el.height <= el.width;
    if (isH) base.borderTop = `${opt.borderWidth}px solid ${opt.borderColor}`;
    else base.borderLeft = `${opt.borderWidth}px solid ${opt.borderColor}`;
  }
  return base;
});

function drawCanvas() {
  const el = props.element;
  const opt = el.options;
  if ((isBarcodeOptions(opt) || isQrcodeOptions(opt)) && canvasRef.value) {
    const value = displayValue() || ' ';
    if (isBarcodeOptions(opt))
      renderBarcode(canvasRef.value, {
        value,
        symbology: opt.symbology,
        displayValue: opt.displayValue,
        fontSize: opt.fontSize
      });
    else renderQrcode(canvasRef.value, { value, ecc: opt.ecc });
  }
}

onMounted(drawCanvas);
watch(() => [props.element.options, props.data], drawCanvas, { deep: true });
</script>

<template>
  <component
    :is="
      isTextOptions(element.options)
        ? 'div'
        : isImageOptions(element.options) || isBarcodeOptions(element.options) || isQrcodeOptions(element.options)
          ? 'img'
          : 'div'
    "
    :style="styleObject"
    v-if="!isImageOptions(element.options) && !isBarcodeOptions(element.options) && !isQrcodeOptions(element.options)"
  >
    {{ isTextOptions(element.options) ? displayValue() : '' }}
    <canvas
      v-if="isBarcodeOptions(element.options) || isQrcodeOptions(element.options)"
      ref="canvasRef"
      style="width:100%;height:100%;display:block;"
    />
  </component>
  <img v-else :src="displayValue()" :style="styleObject" />
</template>
```

> 注：画布态 `img`/`canvas` 分支较绕，实现时可拆成 3 个小组件（TextEl / ImageEl / CodeEl / ShapeEl）提升可读性，逻辑不变。

- [ ] **Step 3: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 5: 画布交互与容器

**Files:**

- Create: `src/views/system-manage/label-designer/modules/use-canvas-interaction.ts`
- Create: `src/views/system-manage/label-designer/modules/design-canvas.vue`

**Interfaces:**

- 依赖：Task 1 `types`、Task 2 store、Task 4 `element-renderer.vue`、`paper-sizes.ts` 的 `parseLabelSize`、`PX_PER_MM` 常量。
- 产出：`useCanvasInteraction(store, getStageEl)` 返回 `{ onDrop, onElementPointerDown, onCanvasPointerDown, startResize, selectedId }`；`design-canvas.vue` 模板（标尺 + 网格 + 纸张 + 元素 + 8 手柄 + 平移/缩放）。

- [ ] **Step 1: 创建 `constants.ts`（Task 4/5 共用，必须在交互逻辑前建立）**

```ts
export const PX_PER_MM = 96 / 25.4;
```

- [ ] **Step 2: 写 `use-canvas-interaction.ts`**

```ts
import { PX_PER_MM } from './constants';
import type { LabelElement } from './types';

export const DRAG_MIME = 'application/x-label-element';

export function useCanvasInteraction(
  store: ReturnType<typeof import('@/store/modules/label-design').useLabelDesignStore>,
  getPaperEl: () => HTMLElement | null
) {
  function clientToMm(clientX: number, clientY: number): { x: number; y: number } {
    const paper = getPaperEl();
    if (!paper) return { x: 0, y: 0 };
    const rect = paper.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / PX_PER_MM / store.zoom,
      y: (clientY - rect.top) / PX_PER_MM / store.zoom
    };
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer?.getData(DRAG_MIME);
    if (!raw) return;
    const desc = JSON.parse(raw) as import('./types').ElementDescriptor;
    const pos = clientToMm(e.clientX, e.clientY);
    store.addElement(desc, { x: Math.max(0, pos.x), y: Math.max(0, pos.y) });
  }

  function onElementPointerDown(e: PointerEvent, el: LabelElement) {
    e.stopPropagation();
    store.selectElement(el.id);
    const start = clientToMm(e.clientX, e.clientY);
    const origin = { x: el.x, y: el.y };
    const move = (ev: PointerEvent) => {
      const cur = clientToMm(ev.clientX, ev.clientY);
      store.updateElement(el.id, {
        x: Math.max(0, origin.x + (cur.x - start.x)),
        y: Math.max(0, origin.y + (cur.y - start.y))
      });
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  function startResize(e: PointerEvent, el: LabelElement, handle: Handle) {
    e.stopPropagation();
    const start = clientToMm(e.clientX, e.clientY);
    const origin = { x: el.x, y: el.y, w: el.width, h: el.height };
    const move = (ev: PointerEvent) => {
      const cur = clientToMm(ev.clientX, ev.clientY);
      const dx = cur.x - start.x;
      const dy = cur.y - start.y;
      let { x, y, w, h } = origin;
      if (handle.includes('e')) w = Math.max(4, origin.w + dx);
      if (handle.includes('s')) h = Math.max(4, origin.h + dy);
      if (handle.includes('w')) {
        w = Math.max(4, origin.w - dx);
        x = origin.x + (origin.w - w);
      }
      if (handle.includes('n')) {
        h = Math.max(4, origin.h - dy);
        y = origin.y + (origin.h - h);
      }
      store.updateElement(el.id, { x, y, width: w, height: h });
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  function onCanvasPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('[data-element-id]')) return;
    // 点纸张空白：取消选中 + 平移（与原 index.vue handleCanvasMouseDown 一致）
    store.selectElement(null);
    const startX = e.clientX;
    const startY = e.clientY;
    // 平移由 design-canvas 自身管理 tx/ty，这里仅取消选中
    void startX;
    void startY;
  }

  return { onDrop, onElementPointerDown, onCanvasPointerDown, startResize, DRAG_MIME };
}
```

- [ ] **Step 2: 写 `design-canvas.vue`**（关键结构；平移/缩放沿用原 `index.vue` 的 tx/ty 思路，本组件内部维护 `tx/ty` 与 `zoom` 透传 store）

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { parseLabelSize } from './paper-sizes';
import { PX_PER_MM } from './constants';
import ElementRenderer from './element-renderer.vue';
import { useCanvasInteraction } from './use-canvas-interaction';

const store = useLabelDesignStore();
const paperEl = ref<HTMLElement | null>(null);
const tx = ref(0);
const ty = ref(0);
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

const paper = computed(() => parseLabelSize(store.template.paperSize));
const paperPx = computed(() => ({ w: paper.value.width * PX_PER_MM, h: paper.value.height * PX_PER_MM }));

const interaction = useCanvasInteraction(store, () => paperEl.value);

function onWheel(e: WheelEvent) {
  store.setZoom(store.zoom + (e.deltaY < 0 ? 0.1 : -0.1));
}
function onPan(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('[data-element-id]')) return;
  const sx = e.clientX;
  const sy = e.clientY;
  const bx = tx.value;
  const by = ty.value;
  const move = (ev: PointerEvent) => {
    tx.value = bx + (ev.clientX - sx);
    ty.value = by + (ev.clientY - sy);
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}
</script>

<template>
  <div
    class="label-designer-canvas relative flex-1 overflow-hidden bg-#f5f5f5 dark:bg-#1f1f1f"
    :class="{ 'hide-ruler': !store.showRuler }"
    @wheel.prevent="onWheel"
    @pointerdown="onPan"
  >
    <div class="pd-stage" :style="{ transform: `translate(${tx}px, ${ty}px)` }">
      <div
        ref="paperEl"
        class="hiprint-printPaper relative bg-white shadow-sm"
        :class="{ 'show-grid': store.showGrid }"
        :style="{ width: `${paperPx.w}px`, height: `${paperPx.h}px` }"
        @drop="interaction.onDrop"
        @dragover.prevent
        @pointerdown="interaction.onCanvasPointerDown"
      >
        <ElementRenderer
          v-for="el in store.elements"
          :key="el.id"
          :element="el"
          :data="{}"
          :style="{ outline: store.selectedId === el.id ? '1px solid #165dff' : 'none' }"
          data-element-id
          @pointerdown="interaction.onElementPointerDown($event, el)"
        />
        <template v-if="store.selected">
          <div
            v-for="h in HANDLES"
            :key="h"
            class="resize-handle"
            :data-handle="h"
            @pointerdown.stop="interaction.startResize($event, store.selected!, h)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #165dff;
  border: 1px solid #fff;
  border-radius: 1px;
  z-index: 10;
}
.resize-handle[data-handle='nw'] {
  left: -4px;
  top: -4px;
  cursor: nwse-resize;
}
.resize-handle[data-handle='n'] {
  left: 50%;
  top: -4px;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle[data-handle='ne'] {
  right: -4px;
  top: -4px;
  cursor: nesw-resize;
}
.resize-handle[data-handle='e'] {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.resize-handle[data-handle='se'] {
  right: -4px;
  bottom: -4px;
  cursor: nwse-resize;
}
.resize-handle[data-handle='s'] {
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle[data-handle='sw'] {
  left: -4px;
  bottom: -4px;
  cursor: nesw-resize;
}
.resize-handle[data-handle='w'] {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.show-grid {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 5mm 5mm;
}
</style>
```

- [ ] **Step 3: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 6: 属性面板（FormWrap）

**Files:**

- Create: `src/views/system-manage/label-designer/modules/property-panel.vue`

**Interfaces:**

- 依赖：Task 1 `types`、Task 2 store。
- 产出：`property-panel.vue`，`props: { element: LabelElement | null }`，`emit: (e:'update')`；按 type 生成 `FormItemConfig[]`，`v-model` 绑定到本地 model，`@change` 调 `store.updateElementOptions`。

- [ ] **Step 1: 写 `property-panel.vue`**

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import type { FormItemConfig } from '@/components/Form';
import type { LabelElement } from './types';
import {
  isBarcodeOptions,
  isImageOptions,
  isLineOptions,
  isQrcodeOptions,
  isRectOptions,
  isTextOptions
} from './types';

const props = defineProps<{ element: LabelElement | null }>();
const store = useLabelDesignStore();
const model = ref<Record<string, unknown>>({});

watch(
  () => props.element,
  el => {
    if (el) model.value = { ...el.options, x: el.x, y: el.y, width: el.width, height: el.height };
  },
  { immediate: true, deep: true }
);

const items = computed<FormItemConfig[]>(() => {
  const el = props.element;
  if (!el) return [];
  const common: FormItemConfig[] = [
    { key: 'x', label: $t('page.manage.labelDesign.propX'), type: 'number', span: 12 },
    { key: 'y', label: $t('page.manage.labelDesign.propY'), type: 'number', span: 12 },
    { key: 'width', label: $t('page.manage.labelDesign.propW'), type: 'number', span: 12 },
    { key: 'height', label: $t('page.manage.labelDesign.propH'), type: 'number', span: 12 }
  ];
  const opt = el.options;
  if (isTextOptions(opt)) {
    return [
      ...common,
      { key: 'text', label: $t('page.manage.labelDesign.propText'), type: 'input', span: 24 },
      { key: 'field', label: $t('page.manage.labelDesign.propField'), type: 'input', span: 24 },
      { key: 'testData', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
      { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 },
      { key: 'color', label: $t('page.manage.labelDesign.propColor'), type: 'input', span: 12 },
      {
        key: 'fontWeight',
        label: $t('page.manage.labelDesign.propWeight'),
        type: 'select',
        span: 12,
        options: [
          { label: 'normal', value: 'normal' },
          { label: 'bold', value: 'bold' }
        ]
      },
      {
        key: 'align',
        label: $t('page.manage.labelDesign.propAlign'),
        type: 'select',
        span: 12,
        options: [
          { label: 'left', value: 'left' },
          { label: 'center', value: 'center' },
          { label: 'right', value: 'right' }
        ]
      },
      { key: 'lineHeight', label: $t('page.manage.labelDesign.propLineHeight'), type: 'number', span: 12 }
    ];
  }
  if (isBarcodeOptions(opt)) {
    return [
      ...common,
      { key: 'field', label: $t('page.manage.labelDesign.propField'), type: 'input', span: 24 },
      { key: 'testData', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
      {
        key: 'symbology',
        label: $t('page.manage.labelDesign.propSymbology'),
        type: 'select',
        span: 12,
        options: ['code128', 'code39', 'ean13', 'ean8', 'upca'].map(v => ({ label: v, value: v }))
      },
      { key: 'displayValue', label: $t('page.manage.labelDesign.propDisplayValue'), type: 'switch', span: 12 },
      { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 }
    ];
  }
  if (isQrcodeOptions(opt)) {
    return [
      ...common,
      { key: 'field', label: $t('page.manage.labelDesign.propField'), type: 'input', span: 24 },
      { key: 'testData', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
      {
        key: 'ecc',
        label: $t('page.manage.labelDesign.propEcc'),
        type: 'select',
        span: 12,
        options: ['L', 'M', 'Q', 'H'].map(v => ({ label: v, value: v }))
      }
    ];
  }
  if (isImageOptions(opt)) {
    return [
      ...common,
      { key: 'src', label: $t('page.manage.labelDesign.propSrc'), type: 'input', span: 24 },
      { key: 'field', label: $t('page.manage.labelDesign.propField'), type: 'input', span: 24 },
      { key: 'testData', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 }
    ];
  }
  if (isRectOptions(opt)) {
    return [
      ...common,
      { key: 'borderWidth', label: $t('page.manage.labelDesign.propBorderWidth'), type: 'number', span: 12 },
      { key: 'borderColor', label: $t('page.manage.labelDesign.propBorderColor'), type: 'input', span: 12 },
      { key: 'bgColor', label: $t('page.manage.labelDesign.propBgColor'), type: 'input', span: 12 },
      { key: 'radius', label: $t('page.manage.labelDesign.propRadius'), type: 'number', span: 12 }
    ];
  }
  if (isLineOptions(opt)) {
    return [
      ...common,
      { key: 'borderWidth', label: $t('page.manage.labelDesign.propBorderWidth'), type: 'number', span: 12 },
      { key: 'borderColor', label: $t('page.manage.labelDesign.propBorderColor'), type: 'input', span: 12 }
    ];
  }
  return common;
});

function onChange() {
  const el = props.element;
  if (!el) return;
  const { x, y, width, height, ...rest } = model.value;
  store.updateElement(el.id, { x: Number(x), y: Number(y), width: Number(width), height: Number(height) });
  store.updateElementOptions(el.id, rest as Record<string, unknown>);
}
</script>

<template>
  <div class="h-full w-full p-12px overflow-auto">
    <NEmpty v-if="!element" :description="$t('page.manage.labelDesign.noSelection')" />
    <NFormWrap v-else ref="formRef" :model="model" :items="items" :show-footer="false" @change="onChange">
      <template #default>
        <!-- FormWrap 内部监听 change；如需显式提交可加按钮 -->
      </template>
    </NFormWrap>
  </div>
</template>
```

- [ ] **Step 2: 验证**
      Run: `pnpm typecheck`
      Expected: PASS（核对 `FormItemConfig` 实际字段名：`type` 取值、`options`、`show-footer` 等以 `src/components/Form/form-config.ts` 为准）

---

## Task 7: 左侧字段面板（原生 draggable）

**Files:**

- Modify: `src/views/system-manage/label-designer/modules/field-panel.vue`
- 依赖：Task 1 `types`、`basic-elements.ts`、`print-fields.ts`、`use-canvas-interaction.ts` 的 `DRAG_MIME`

**Interfaces:**

- 产出：拖拽项 `draggable=true`，`dragstart` 写入 `dataTransfer.setData(DRAG_MIME, JSON.stringify(descriptor))`。

- [ ] **Step 1: 改写 `field-panel.vue` 的拖拽部分**（保留折叠 `<details>` 结构与样式）

```vue
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { $t } from '@/locales';
import type { PrintFieldGroup } from './print-fields';
import { basicElements } from './basic-elements';
import { DRAG_MIME } from './use-canvas-interaction';
import type { ElementDescriptor } from './types';

defineProps<{ groups: PrintFieldGroup[] }>();
const rootRef = ref<HTMLElement | null>(null);
const expandedNames = ref<string[]>([]);

function onDragStart(e: DragEvent, desc: ElementDescriptor) {
  e.dataTransfer?.setData(DRAG_MIME, JSON.stringify(desc));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
  <div ref="rootRef" class="field-panel h-full w-full flex flex-col overflow-hidden">
    <NScrollbar class="min-h-0 flex-1">
      <div class="field-menu">
        <details v-for="group in groups" :key="group.key" class="field-group" :open="expandedNames.includes(group.key)">
          <summary class="field-group-summary">
            <span class="field-group-title">{{ group.label }}</span>
          </summary>
          <div class="field-group-content">
            <div
              v-for="field in group.fields"
              :key="field.key"
              class="field-item"
              draggable="true"
              @dragstart="onDragStart($event, { type: field.type, field: field.key, testData: field.sample })"
            >
              {{ field.label }}
            </div>
          </div>
        </details>
        <details class="field-group" :open="expandedNames.includes('basic')">
          <summary class="field-group-summary">
            <span class="field-group-title">{{ $t('page.manage.labelDesign.basicElements') }}</span>
          </summary>
          <div class="field-group-content">
            <div
              v-for="item in basicElements"
              :key="item.type"
              class="field-item"
              draggable="true"
              @dragstart="onDragStart($event, { type: item.type, ...item.defaultOptions })"
            >
              {{ $t(item.labelKey) }}
            </div>
          </div>
        </details>
      </div>
    </NScrollbar>
  </div>
</template>
```

> 样式（`.field-group` / `.field-item` 等）沿用现有 `field-panel.vue` 的 `<style scoped>`，仅把 `.ep-draggable-item`/`tid` 相关去掉。

- [ ] **Step 2: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 8: 预览/打印弹窗

**Files:**

- Modify: `src/views/system-manage/label-designer/modules/preview-modal.vue`
- 依赖：Task 4 `buildPreviewHtml`、`print-fields.ts` 的 `buildSampleData`、Task 2 store

**Interfaces:**

- 产出：`preview-modal.vue`，`props: { show, template: LabelTemplate }`，`emit: update:show`；内部 `buildPreviewHtml` 注入 iframe `srcdoc`，点打印 `contentWindow.print()`。

- [ ] **Step 1: 改写 `preview-modal.vue`**

```vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { $t } from '@/locales';
import { buildPreviewHtml } from './render-element-html';
import { buildSampleData } from './print-fields';
import type { LabelTemplate } from './types';

const props = defineProps<{ show: boolean; template: LabelTemplate }>();
const emit = defineEmits<{ 'update:show': [boolean] }>();
const html = ref('');

function handlePrint() {
  document.querySelector<HTMLIFrameElement>('#print-preview-frame')?.contentWindow?.print();
}
function build() {
  const data = buildSampleData();
  // 预览填充：字段元素以 testData 优先（与现有 extractPreviewData 思路一致）
  html.value = buildPreviewHtml(props.template, data);
}
watch(
  () => props.show,
  val => {
    if (val) {
      build();
      nextTick(() => setTimeout(fit, 0));
    }
  }
);
function fit() {
  const frame = document.querySelector<HTMLIFrameElement>('#print-preview-frame');
  const doc = frame?.contentDocument;
  const paper = doc?.querySelector('div');
  if (frame && paper) {
    const r = paper.getBoundingClientRect();
    frame.style.width = `${r.width}px`;
    frame.style.height = `${r.height}px`;
  }
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :style="{ width: 'auto', maxWidth: '95vw' }"
    :title="$t('page.manage.labelDesign.preview')"
    @update:show="v => emit('update:show', v)"
  >
    <div class="w-fit bg-#f5f5f5">
      <iframe id="print-preview-frame" class="border-0" scrolling="no" :srcdoc="html" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton size="small" @click="emit('update:show', false)">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" size="small" @click="handlePrint">{{ $t('page.manage.labelDesign.print') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
```

- [ ] **Step 2: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 9: 编排页面与工具栏

**Files:**

- Create: `src/views/system-manage/label-designer/index.vue`（新建，全新组件）
- Create: `src/views/system-manage/label-designer/modules/tool-bar.vue`（新建）

**Interfaces:**

- 依赖：Task 2 store、Task 5 `design-canvas.vue`、Task 6 `property-panel.vue`、Task 7 `field-panel.vue`、Task 8 `preview-modal.vue`、`print-fields.ts`、`paper-sizes.ts` 的 `paperOptions`、`fetchGetPrintTemplateDetail`、`fetchSavePrintTemplateDesign`。
- 产出：完整三栏页面；`onMounted` 加载（无 id 优雅降级，见 §11）、保存、预览、清空（store.reset）、撤销/重做。

- [ ] **Step 1: 改写 `tool-bar.vue`**：在 `defineEmits` 增加 `undo` / `redo`，模板在「清空」前加两个按钮（`:disabled="!canUndo"` / `:disabled="!canRedo"`，由 props 传入）。

- [ ] **Step 2: 改写 `index.vue`**

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPrintTemplateDetail, fetchSavePrintTemplateDesign } from '@/service/api/print-format';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { printFieldGroups } from './modules/print-fields';
import { paperOptions } from './modules/paper-sizes';
import ToolBar from './modules/tool-bar.vue';
import FieldPanel from './modules/field-panel.vue';
import DesignCanvas from './modules/design-canvas.vue';
import PropertyPanel from './modules/property-panel.vue';
import PreviewModal from './modules/preview-modal.vue';

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const store = useLabelDesignStore();

const templateId = ref(Number(route.query.id ?? 0));
const templateName = ref(String(route.query.name ?? $t('page.manage.labelDesign.untitled')));
const paperSize = ref(store.template.paperSize);
const saving = ref(false);
const previewVisible = ref(false);

const options = paperOptions.map(i => ({ label: i.label, value: i.label }));

function handleBack() {
  if (window.history.length > 1) window.history.back();
  else routerPushByKey('system-manage_setting', { query: { tab: 'print-format' } });
}
function handlePaperChange(v: string) {
  paperSize.value = v;
  store.setPaper(v);
}
function handleClear() {
  window.$dialog?.warning({
    title: $t('page.manage.labelDesign.clearConfirm'),
    content: $t('page.manage.labelDesign.clearContent'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => store.reset()
  });
}
async function handleSave() {
  if (!templateId.value) {
    window.$message?.warning($t('page.manage.labelDesign.noTemplateId'));
    return;
  }
  saving.value = true;
  try {
    await fetchSavePrintTemplateDesign({
      id: templateId.value,
      designJson: store.toJson(),
      paperSize: paperSize.value
    });
    window.$message?.success($t('page.manage.labelDesign.saveSuccess'));
  } finally {
    saving.value = false;
  }
}
function handlePreview() {
  previewVisible.value = true;
}

onMounted(async () => {
  document.body.classList.add('label-designer-no-scroll');
  // 无 id 优雅降级：DEV 默认取 mock 第一个模板（id=1），否则空白模板
  if (!templateId.value) {
    const devDefault = import.meta.env.DEV ? 1 : 0;
    templateId.value = devDefault;
  }
  if (templateId.value) {
    try {
      const detail = (await fetchGetPrintTemplateDetail(templateId.value)) as Api.PrintFormat.Template;
      paperSize.value = detail.paperSize || detail.labelSize;
      store.loadFromJson(detail.designJson);
      store.setPaper(paperSize.value);
    } catch {
      store.reset();
    }
  } else {
    store.reset();
  }
});
onBeforeUnmount(() => document.body.classList.remove('label-designer-no-scroll'));
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <ToolBar
      :title="templateName"
      :paper-size="paperSize"
      :scale="store.zoom"
      :show-grid="store.showGrid"
      :show-ruler="store.showRuler"
      :can-undo="store.canUndo"
      :can-redo="store.canRedo"
      @toggle-ruler="store.showRuler = !store.showRuler"
      @back="handleBack"
      @update:paper-size="handlePaperChange"
      @zoom-out="store.setZoom(store.zoom - 0.1)"
      @zoom-in="store.setZoom(store.zoom + 0.1)"
      @toggle-grid="store.showGrid = !store.showGrid"
      @undo="store.undo()"
      @redo="store.redo()"
      @clear="handleClear"
      @save="handleSave"
      @preview="handlePreview"
    />
    <div class="min-h-0 flex flex-1">
      <div class="w-240px shrink-0 border-r border-#eee dark:border-#333">
        <FieldPanel :groups="printFieldGroups" />
      </div>
      <DesignCanvas />
      <div class="w-320px shrink-0 border-l border-#eee dark:border-#333">
        <PropertyPanel :element="store.selected" />
      </div>
    </div>
    <PreviewModal v-model:show="previewVisible" :template="store.template" />
  </div>
</template>
```

- [ ] **Step 3: 验证**
      Run: `pnpm typecheck`
      Expected: PASS

---

## Task 10: 菜单测试入口 + i18n + 无 id 降级

**Files:**

- Modify: `build/plugins/router.ts`（`onRouteMetaGen` 为新增路由 `system-manage_label-designer` 增加 `routeIcons` / `routeOrders`；print-design 保持原 `hideInMenu` 不变）
- Modify: `src/locales/langs/zh-cn.ts` / `en-us.ts` / `src/typings/app.d.ts`（新增键，见下）
- Modify: `src/views/system-manage/label-designer/modules/constant.ts`（新增 `PX_PER_MM` / `PAPER_SIZES` / `parsePaper`）

**Interfaces:**

- 产出：菜单可见；新增 i18n 键全部同步。

- [ ] **Step 1: `build/plugins/router.ts` 的 `onRouteMetaGen`** 为新增路由 `system-manage_label-designer` 在 `routeIcons` 与 `routeOrders` 中增加条目（print-design 的 `hideInMenu` 保持不变）。（`constant.ts` 已在 Task 5 建立）

- [ ] **Step 3: 新增 i18n 键（zh-cn / en-us 同步，并在 `typings/app.d.ts` 的 `App.I18n.Schema` 补 `route.system-manage_label-designer` 与 `page.manage.labelDesign.*`）**

新增/需确认键：

- `route.system-manage_label-designer`（菜单名「标签设计」）
- `page.manage.labelDesign.untitled`（未命名）
- `page.manage.labelDesign.noTemplateId`（无模板 id 提示）
- `page.manage.labelDesign.noSelection`（未选中元素）
- `page.manage.labelDesign.propX/Y/W/H`、`propText`、`propField`、`propTestData`、`propFontSize`、`propColor`、`propWeight`、`propAlign`、`propLineHeight`、`propSymbology`、`propDisplayValue`、`propEcc`、`propSrc`、`propBorderWidth`、`propBorderColor`、`propBgColor`、`propRadius`
- `page.manage.labelDesign.basicText/LongText/Image/Barcode/Qrcode/Rect/Hline/Vline`（基础元素名）

- [ ] **Step 4: 验证**
      Run: `pnpm typecheck`
      Expected: PASS（TS 会因 `App.I18n.I18nKey` 缺失键报错，补全 `typings/app.d.ts` 后即过）

---

## 说明：依赖保留（不执行移除）

用户明确要求**不删除** `vue-plugin-hiprint` / `jquery` / `@types/jquery` / `src/typings/hiprint.d.ts` / `vite.config.ts` 的 `optimizeDeps.include` 两项。因此本计划**不包含依赖移除步骤**。新自研代码不 import 这些依赖，它们不会被打进新设计器产物；保留仅为不改动既有依赖清单。

---

## 自查（Self-Review）

1. **规格覆盖**：§1 范围（拖入/选中/移动/缩放/属性面板/预览/撤销/无 table）→ Task 1–10 覆盖；§11 菜单测试入口 → Task 10；§9 文件变动 → 各 Task 对应；依赖保留（用户要求不删除，无移除 Task，见文末「依赖保留」说明）。
2. **占位符扫描**：无 TBD/TODO；各 Task 均含可执行的代码或命令。
3. **类型一致性**：`LabelElement`/`LabelTemplate`/`ElementDescriptor` 在 Task 1 定义，后续 Task 2/4/5/6/8/9 引用一致；`useLabelDesignStore` 返回成员（selected/canUndo/canRedo/toJson/loadFromJson/setPaper/setZoom/updateElement/updateElementOptions/addElement/removeElement/selectElement/reset）在 Task 9 全部一致引用；`DRAG_MIME` 在 Task 5 定义、Task 7 引用；`PX_PER_MM` 在 Task 10 定义、Task 4/5 引用（注意 Task 4/5 若早于 Task 10 编译会因缺 `constants.ts` 报错——实现顺序需保证 `constants.ts` 在 Task 5 前创建，建议在 Task 5 Step 1 开头即建 `constants.ts`，而非依赖 Task 10）。
4. **风险**：`element-renderer.vue` 的 `<component :is>` 三元分支较绕，计划已提示可拆小组件；`bwip-js` 导入形态按实际包版本核对（Task 3 已标注）。
