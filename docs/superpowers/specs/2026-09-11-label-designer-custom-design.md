# 标签设计器自研方案（替代 vue-plugin-hiprint）

> 状态：设计已确认，待实现。实现记录另见 `changelog/标签设计器自研方案.md`。
>
> 背景：现有 `src/views/system-manage/print-design/` 基于 `vue-plugin-hiprint`（依赖 jQuery、jspdf、bwip-js、html2canvas、socket.io-client，且自带属性面板暗黑模式适配差、需 `history:true` 才支持撤销）。本方案用「纯数据驱动的 Vue 组件树」完全自研替代，仅引入 `bwip-js` 做条码/二维码算法渲染。

## 1. 目标与范围

**目标**：在不依赖 `vue-plugin-hiprint` / `jquery` 的前提下，复刻现有标签设计器的全部核心能力，并顺手修复已知限制。

**界面形态（沿用现有三栏 + 顶栏）**：

```
┌──────────────────── 顶部工具栏 ────────────────────┐
│ 返回 | 模板名 | 纸张▾ | − 100% + | 网格 | 标尺 | 清空 撤销 重做 保存 预览 │
├──────────┬────────────────────────┬────────────────┤
│ 左侧 240 │  中间画布              │ 右侧 ~320      │
│ 字段/元素 │  标尺 + 网格 + 纸张    │ 属性面板       │
│ 折叠分组  │  (元素可拖/选/移/缩放) │ (FormWrap)     │
└──────────┴────────────────────────┴────────────────┘
```

**本期做（与现有对等 + 修复限制）**：

- 拖拽字段/基础元素入画布，拖入即带 `field` / `testData` 绑定。
- 元素选中 / 移动 / 8 向缩放（全部 pointer 事件手写，零额外 DOM 库）。
- 纸张尺寸切换、画布缩放(0.2–4.0)、平移、网格、标尺。
- 右侧属性面板（用仓库已有 `FormWrap`，**天然暗黑模式**）。
- 撤销 / 重做（快照式，带工具栏按钮）。
- 预览（生成静态 HTML 注入 iframe）→ `window.print()`。
- 保存/加载：`designJson` 存自研模板 JSON（复用现有 `fetchGetPrintTemplateDetail` / `fetchSavePrintTemplateDesign`）。

**本期不做（YAGNI，同现有）**：多面板分页、客户端静默打印。

**v1 砍掉的元素类型**：`table`（字段绑定 + 列配置最重，单独立项）。v1 支持 `text / longText / image / barcode / qrcode / rect / hline / vline`。

## 2. 数据模型（替代 hiprint `getJson`）

逻辑单位统一用 **mm**（与屏幕分辨率解耦，打印直接用 CSS `100mm` 还原真实尺寸）。

```ts
// modules/types.ts
export type ElementType = 'text' | 'longText' | 'image' | 'barcode' | 'qrcode' | 'rect' | 'hline' | 'vline';

export interface BaseOptions {
  /** 绑定的数据字段名；存在时设计态显示 testData，预览/打印时显示真实数据 */
  field?: string;
  /** 设计态示例值（无真实数据时显示） */
  testData?: string;
}

export interface TextOptions extends BaseOptions {
  text?: string; // 非字段文本（field 为空时使用）
  fontSize: number; // pt
  color: string; // hex
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface ImageOptions extends BaseOptions {
  src?: string; // 静态图片地址（field 为空时使用）
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
  id: string; // nanoid
  type: ElementType;
  x: number;
  y: number; // mm
  width: number;
  height: number; // mm
  options: ElementOptions;
}

export interface LabelTemplate {
  paperSize: string; // 与 paperOptions.label 对齐，如 '100×150mm'
  elements: LabelElement[];
}
```

> 类型守卫：`isTextOptions(o): o is TextOptions` 等，配合 `element.type` 收窄，避免 `any`。

## 3. 坐标与画布（`design-canvas.vue` + `use-canvas-interaction.ts`）

- 常量 `PX_PER_MM = 96 / 25.4`（≈ 3.7795）。纸张像素尺寸 `paperWmm * PX_PER_MM`。
- 外层 viewport（`.label-designer-canvas`）：`overflow:hidden`，承载**平移(tx/ty) + 滚轮缩放(zoom)**。复用现有缩放逻辑（围绕纸张中心补偿，范围 0.2–4.0，步进 0.1）。
- 内层 `.pd-stage`：`transform: scale(zoom) translate(...)`。
- **网格**：CSS 线性渐变（保留现有 `show-grid` 方案，仅作用于设计态）。
- **标尺**：自绘刻度（CSS `repeating-linear-gradient` 或轻量组件），去掉 hiprint `.h_img`/`.v_img` 图片依赖。显隐由 `showRuler` 控制。
- **整页滚动禁用**：沿用 `body.label-designer-no-scroll` 方案（index.vue 挂载/卸载时切换）。

### 交互（全部手写 pointer 事件，无 moveable）

- **拖入新建**：左侧项 `draggable=true`，`dragstart` 写入 `dataTransfer` 的 JSON 描述 `{type, field?, testData?, sample?}`；画布 `@drop` 将 client 坐标相对纸张换算成 mm 落点 → `store.addElement(...)`。替代 hiprint 的 jQuery `buildByHtml`。
- **选中**：元素体 `pointerdown`（非手柄）→ `store.selectElement(id)`；点纸张空白 → 取消选中。
- **移动**：选中元素体 `pointerdown` 进入 move，px 位移 ÷ `(PX_PER_MM * zoom)` 转 mm 增量更新 `x/y`；可选网格吸附（吸附粒度 1mm）。
- **缩放**：选中态渲染 8 个 resize 手柄（四角 + 四边中点），`pointerdown` 按手柄方向改 `x/y/w/h`，带最小尺寸约束（如 `w/h >= 4mm`）。
- **删除**：`Delete` / `Backspace`（输入态除外）删除选中。
- 全程使用 `setPointerCapture` 保证拖出元素不丢事件；移动/缩放结束才提交一次历史快照（见 §6）。

## 4. 元素渲染

### 画布态（`element-renderer.vue` 按 type 分发）

- `text/longText`：绝对定位 `<div>`，样式来自 `TextOptions`；`field` 存在显示 `testData`（无则固定文案或 `text`）。
- `image`：`<img :src="field ? testData : src">`（测试数据可填图片 URL）。
- `barcode/qrcode`：`<canvas>` 由 `modules/barcode.ts` 渲染（见 §5）。
- `rect`：带 `border/bg/radius` 的 `<div>`。
- `hline/vline`：细 `<div>`（border-top 或 border-left）。

### 预览/打印态（`render-element-html.ts`）

纯静态 HTML 字符串生成，复用同一份逻辑与样式常量：

- 文本/矩形/线 → 绝对定位 `<div>` + 内联样式（`left/top/width/height` 用 `mm`）。
- 条码/二维码 → `barcodeToDataURL(opts)` 得到 dataURL，内嵌 `<img src="data:...">`（避免 iframe 内跑 JS）。
- 数据绑定：传入 `dataMap`，`field` 命中则用真实值，否则回退 `testData`。

## 5. 条码 / 二维码（`modules/barcode.ts`）

- 依赖 `bwip-js`（单包覆盖 1D+2D，与 hiprint 同引擎，浏览器 ESM，无 jQuery）。
- 封装：
  - `renderBarcode(canvas: HTMLCanvasElement, opts: BarcodeOptions & { value: string }): void` —— 画布态直接绘制。
  - `barcodeToDataURL(opts): string` —— `canvas.toDataURL('image/png')`，供预览内嵌。
  - `renderQrcode(...)` / `qrcodeToDataURL(...)` 同理，均走 `bwip-js`（其内置 `qrcode` 类型），不引入第二个库。
- 容错：`try/catch` 绘制失败时画布显示占位文本（如 `INVALID`），不抛出。

## 6. 状态管理（`store/modules/label-design`，Pinia Setup Store）

替代 hiprint 实例状态与 `history:true`。

```ts
// store/modules/label-design/index.ts
export const SetupStoreId = { /* 已有枚举 */ LabelDesign: 'label-design' } as const;

export function useLabelDesignStore() {
  const template = ref<LabelTemplate>({ paperSize: '100×150mm', elements: [] });
  const selectedId = ref<string | null>(null);
  const zoom = ref(1);
  const showGrid = ref(true);
  const showRuler = ref(true);

  // 撤销/重做：快照式
  const past = ref<LabelElement[][]>([]);
  const future = ref<LabelElement[][]>([]);

  function commit() {
    past.value.push(clone(elements.value));
    future.value = [];
  } // 每次改动前/后入栈
  function undo() {
    /* pop past → push future → 恢复 */
  }
  function redo() {
    /* 反向 */
  }

  function addElement(desc: ElementDescriptor) {
    commit();
    elements.value.push(createElement(desc));
  }
  function updateElement(id: string, patch: Partial<LabelElement>) {
    /* 属性面板实时改，move/resize 结束 commit */
  }
  function removeElement(id: string) {
    commit(); /* 过滤 */
  }
  function selectElement(id: string | null) {
    selectedId.value = id;
  }
  function setPaper(size: string) {
    template.value.paperSize = size;
  } // 不删元素
  function loadFromJson(json: string) {
    template.value = parseOrEmpty(json);
  }
  function toJson(): string {
    return JSON.stringify(template.value);
  }

  return {
    template,
    selectedId,
    zoom,
    showGrid,
    showRuler,
    past,
    future,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    setPaper,
    undo,
    redo,
    loadFromJson,
    toJson
  };
}
```

- id 取自 `src/enum/index.ts` 的 `SetupStoreId`（禁止硬编码字符串）。
- 快照式撤销：`move`/`resize` 实时改坐标但**不**入栈，指针抬起（一次完整操作）才 `commit()` 一次；属性面板每次字段 change 可合并或每次 `commit`（首版每次提交，后续按需节流）。

## 7. 左侧字段面板 / 右侧属性面板

- **左侧 `field-panel.vue`**：`printFieldGroups` / `basicElements` 数据保留；把 hiprint 的 `.ep-draggable-item`+`tid` 改为原生 `draggable` + `dataTransfer`（拖拽描述见 §3）。默认折叠分组、`MutationObserver` 无需（原生 draggable 绑定到已渲染元素即可）。
- **右侧 `property-panel.vue`（新增，替代 hiprint `#Setting`）**：用仓库已有 **`FormWrap`**（`FormItemConfig[]` 配置驱动），按 `selectedElement.type` 动态生成表单项：
  - 通用：`x / y / width / height`（数字输入，mm）。
  - `text/longText`：字号、颜色(`NColorPicker`)、加粗、对齐(`NSelect`)、行高、文本/字段、测试数据。
  - `barcode`：码制下拉、是否显示值、字号。
  - `qrcode`：纠错级别。
  - `image`：图片地址 / 字段。
  - `rect/line`：边框宽、边框色、底色（rect）、圆角（rect）。
  - 改动 `v-model` → `store.updateElement(id, { options })`，响应式即时生效。
  - 未选中元素时显示空状态提示。

## 8. 预览 / 打印（`preview-modal.vue` 重写）

1. `(document.activeElement as HTMLElement)?.blur()` 强制提交属性面板输入。
2. `await nextTick()` + `setTimeout(0)` 等模型同步。
3. `buildPreviewHtml(template, dataMap)`（`render-element-html.ts`）生成完整 HTML 文档：
   - `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0}…</style></head><body>{paperDiv}</body></html>`。
   - `paperDiv`：绝对定位容器，`width/height` 用 `mm`，内含各元素 `<div>`/`<img>`。
   - `dataMap` 取自设计器各字段元素「当前 testData」（`extractPreviewData`，沿用现有思路），回退 `buildSampleData()`。
4. `iframe :srcdoc` 注入 → `contentWindow.print()`。复用现有 `fitFrameSize` 自适应弹窗尺寸逻辑。
5. 不引入 hiprint 的 `print-lock.css`（自研 HTML 自带必要样式）。

## 9. 依赖与文件变动

**新增依赖**：`bwip-js`（仅此一个算法库）。

**依赖保留（用户要求不删除）**：`vue-plugin-hiprint`、`jquery`、`@types/jquery`、`src/typings/hiprint.d.ts`、`vite.config.ts` 的 `optimizeDeps.include` 两项均保留，不移除。新自研代码不 import 这些依赖，故它们不会被打进新设计器产物。

**复用（仅依赖，不改动现有 print-design）**：

- `service/api/print-format.ts`：`fetchGetPrintTemplateList` / `fetchGetPrintTemplateDetail` / `fetchSavePrintTemplateDesign` 原样复用；`designJson` 改为存自研 `LabelTemplate` JSON 字符串。
- `Api.PrintFormat.Template.designJson` 注释更新为「自研标签模板 JSON」。
- 项目已有 `FormWrap`、`bwip-js`、`NScrollbar` 等通用能力。

**新建（全部位于 `src/views/system-manage/label-designer/`，与现有 `print-design` 并存、互不干扰）**：

| 文件                                  | 动作 | 说明                                                                |
| ------------------------------------- | ---- | ------------------------------------------------------------------- |
| `index.vue`                           | 新建 | 编排三栏 + 工具栏，接 store，挂载交互                               |
| `modules/design-canvas.vue`           | 新建 | 纸张 + 标尺 + 网格 + 元素渲染 + 拖放/选中/移动/缩放                 |
| `modules/element-renderer.vue`        | 新建 | 按 type 分发画布态渲染                                              |
| `modules/property-panel.vue`          | 新建 | FormWrap 属性面板                                                   |
| `modules/preview-modal.vue`           | 新建 | 静态 HTML 预览打印（iframe + `window.print()`）                     |
| `modules/render-element-html.ts`      | 新建 | 预览/打印态 HTML 生成（与画布态共享样式常量）                       |
| `modules/barcode.ts`                  | 新建 | bwip-js 封装：canvas 绘制 + dataURL                                 |
| `modules/types.ts`                    | 新建 | `LabelTemplate` / `LabelElement` / 各 `Options`                     |
| `modules/use-canvas-interaction.ts`   | 新建 | pointer 事件：拖放/选中/移动/缩放/吸附                              |
| `modules/field-panel.vue`             | 新建 | 原生 draggable + dataTransfer 字段面板                              |
| `modules/basic-elements.ts`           | 新建 | 描述结构 `{ type, labelKey, defaultOptions }`（不使用 hiprint tid） |
| `modules/constant.ts`                 | 新建 | `PX_PER_MM` / `PAPER_SIZES` / `parsePaper`                          |
| `modules/tool-bar.vue`                | 新建 | 撤销/重做/网格/标尺/缩放/预览                                       |
| `store/modules/label-design/index.ts` | 新建 | Pinia Setup Store + 撤销重做                                        |

## 10. 风险与取舍

- **迁移兼容**：已存 `designJson` 是 hiprint 格式，自研加载时应识别为非自研 JSON（解析失败 / 缺 `elements` 字段）→ 视为空模板，避免崩溃。旧模板需用户在设计器重做（v1 不做格式转换）。
- **暗黑模式**：属性面板用 Naive `FormWrap` 自动适配；画布元素为自绘 `<div>`，文字/边框颜色取元素自身 `options.color`，不继承主题，符合「所见即所得」打印语义。
- **包体积**：`bwip-js` 动态 import（或按需），不进主包。
- **标尺精度**：自绘刻度用 CSS，缩放时仅视觉比例尺变化，不影响元素 mm 坐标（坐标是逻辑值，与缩放无关）。
- **i18n**：新增键（撤销/重做等）需 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts` 同步。

## 11. 测试入口（菜单可达）

- 新增路由 `system-manage_label-designer` 即自带可见菜单项（`onRouteMetaGen` 的 `routeIcons` / `routeOrders` 已加条目），无需改动现有 `system-manage_print-design` 的 `hideInMenu`；并补 `route.system-manage_label-designer` 的 zh-cn / en-us / `typings/app.d.ts` 文案。
- **无 id 优雅降级**：进入页面时若无 `route.query.id`，不再直接报错退出：
  - DEV：默认取 mock 第一个模板（id=1）加载，便于从菜单直接进入测试。
  - 生产 / 无匹配模板：以空白新模板（`{ paperSize:'100×150mm', elements:[] }`）打开，保存时由列表「设计」流程补齐 id（或后续支持无 id 新建，本期仅保证不崩溃）。

## 12. 验收标准

- `pnpm typecheck` / `pnpm lint` / `pnpm build` 全通过。
- DEV 下：拖字段入画布 → 属性面板改样式且显示 `field` → 切纸张保留元素 → 缩放/平移 → 网格/标尺显隐 → 撤销/重做 → 预览显示示例数据且能唤起打印 → 保存后重进回显一致。
- 设计器依赖不含 hiprint / jquery（构建产物主 chunk 无此二包）。
- 暗黑模式下属性面板可用、画布元素按自身颜色渲染。
