# 标签打印模板设计器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 `vue-plugin-hiprint` 实现独立路由的标签设计器页面（左侧业务字段拖拽面板 + 中间画布 + 右侧 hiprint 自带属性面板 + 顶部工具栏），并把模板 JSON 保存到打印格式模板。

**Architecture:** 设计器页 `src/views/system-manage/print-design/index.vue` 为容器，私有子组件放同级 `modules/`；`modules/use-hiprint.ts` 负责 jQuery 全局注入 + hiprint 动态加载 + 自定义 provider 注册，画布由 `hiprintTemplate.design()` 挂载，属性面板挂 `#PrintElementOptionSetting`；保存走 `service/api/print-format.ts` 新增的 detail / saveDesign 接口（DEV 走内存 mock）。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、TypeScript 6 strict、Naive UI 2.44、vue-plugin-hiprint 0.0.60、jquery 3.6、Vite 8、elegant-router（路由自动生成）、vue-i18n。

## Global Constraints

- 只用 pnpm（`pnpm add` 失败时用 PowerShell 执行 `$env:NODE_OPTIONS=""; pnpm add ...`，绕开本机 node-safe-delete-shim；cmd 的 `set NODE_OPTIONS=` 无效）。
- **禁止 `any`**，必要时 `unknown` + 类型收窄。
- 禁止手改 `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`。
- 新增 i18n key 必须同步三处：`src/locales/langs/zh-cn.ts`、`src/locales/langs/en-us.ts`、`src/typings/app.d.ts` 的 `App.I18n.Schema`；新增路由还要补 `route.<routeKey>`。
- 硬编码文案一律走 i18n；注释用**中文**（用户偏好，覆盖 AGENTS.md 的英文 JSDoc 约定），技术名词保留英文。
- 本项目**没有测试框架**：每个任务的验证是 `pnpm typecheck`（必须 0 error）+ `pnpm lint`（必须 0 error）+ 需要时 `pnpm build`；冒烟靠 `pnpm dev` 手测。
- 提交用 `pnpm commit:zh`（**不要** `git commit`）；提交前必须真正跑过 `pnpm fmt`，否则 pre-commit 的 `git diff --exit-code` 会拦。
- 页面容器布局沿用仓库约定：`flex` + `min-h-0` + `overflow-hidden`，滚动交给内部区域，**不要**多套 `absolute inset-0`。

---

### Task 1: 依赖安装与工程配置

**Files:**

- Modify: `package.json`（由 pnpm 写入）
- Modify: `vite.config.ts:34-49`（`build` 之后增加 `optimizeDeps`）
- Create: `src/typings/hiprint.d.ts`

**Interfaces:**

- Produces: `src/typings/hiprint.d.ts` 中的 `declare module 'vue-plugin-hiprint'`，Task 4 起所有任务依赖它做类型检查。

- [ ] **Step 1: 安装依赖**

```powershell
cd d:\LINFLY\CWMS\user-admin-web
$env:NODE_OPTIONS=""; pnpm add vue-plugin-hiprint jquery
$env:NODE_OPTIONS=""; pnpm add -D @types/jquery
```

- [ ] **Step 2: 确认实际 API 签名（务必做，后续全部依赖）**

在 `node_modules/vue-plugin-hiprint/dist/vue-plugin-hiprint.js` 中搜索并记下：

```powershell
Select-String -Path node_modules/vue-plugin-hiprint/dist/vue-plugin-hiprint.js -Pattern 'setPaper\s*\(|zoom\s*\(|clear\s*\(|getHtml\s*\(|defaultModule\.|addPrintElementTypes|buildByHtml' | Select-Object -First 40
```

必须确认 4 件事，结果记录到 `changelog/标签打印模板设计器设计方案.md` 的「落地核对」小节：

1. `setPaper` 的形参（是 `(width, height)` 还是 `(paperType)`）；
2. `zoom`、`clear` 是否存在（不存在则 Task 7 用「重建实例」兜底）；
3. `defaultModule.*` 的 tid 清单（Task 5 的基础元素分组要用）；
4. `PrintElementType` 的 options 是否支持 `field` / `testData`。

- [ ] **Step 3: 写类型声明**

```ts
// src/typings/hiprint.d.ts
declare module 'vue-plugin-hiprint' {
  /** 可拖拽元素的参数（field 为数据绑定字段名，testData 为设计态示例值） */
  export interface PrintElementTypeOptions {
    field?: string;
    testData?: string;
    title?: string;
    [key: string]: unknown;
  }

  export class PrintElementType {
    constructor(options: { tid: string; title?: string; type?: string; options?: PrintElementTypeOptions });
  }

  export interface ElementTypeContext {
    removePrintElementTypes(key: string): void;
    addPrintElementTypes(key: string, types: PrintElementType[]): void;
  }

  export interface ElementTypeProvider {
    addElementTypes(context: ElementTypeContext): void;
  }

  export class defaultElementTypeProvider implements ElementTypeProvider {
    addElementTypes(context: ElementTypeContext): void;
  }

  export interface PrintTemplateOptions {
    template?: unknown;
    settingContainer?: string;
    paginationContainer?: string;
    history?: boolean;
    dataMode?: number;
    onDataChanged?: (type: string, json: unknown) => void;
    onUpdateError?: (error: unknown) => void;
  }

  export class PrintTemplate {
    constructor(options?: PrintTemplateOptions);
    design(selector: string): void;
    getJson(): unknown;
    setPaper(width: number | string, height?: number): void;
    zoom(scale: number): void;
    getHtml(data?: Record<string, unknown>): string;
    clear(): void;
    print(data: Record<string, unknown>, options?: unknown, extra?: unknown): void;
  }

  export const hiprint: {
    init(options?: { providers?: ElementTypeProvider[]; lang?: string; host?: string; token?: string }): void;
    setConfig(config?: Record<string, unknown>): void;
    PrintElementTypeManager: { buildByHtml(elements: unknown): void };
  };

  export function disAutoConnect(): void;
  export function autoConnect(callback?: (status: boolean, msg: string) => void): void;
}
```

- [ ] **Step 4: Vite 预构建配置**

```ts
// vite.config.ts（build 字段之后）
optimizeDeps: {
  include: ['vue-plugin-hiprint', 'jquery'];
}
```

- [ ] **Step 5: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error（此时新文件还没被引用，`hiprint.d.ts` 会被全局加载）。

- [ ] **Step 6: 提交**

```powershell
$env:NODE_OPTIONS=""; pnpm commit:zh
```

类型选 `feat`，摘要：`安装 hiprint 依赖并补充类型声明与预构建配置`。

---

### Task 2: 数据层（类型 + 接口 + mock）

**Files:**

- Modify: `src/typings/api/print-format.d.ts`
- Modify: `src/service/api/print-format.ts`

**Interfaces:**

- Produces: `Api.PrintFormat.Template.designJson` / `paperSize`；
  `fetchGetPrintTemplateDetail(id: number): Promise<Api.PrintFormat.Template>`；
  `fetchSavePrintTemplateDesign(params: { id: number; designJson: string; paperSize: string }): Promise<boolean>`。Task 7、Task 9 依赖。

- [ ] **Step 1: 扩展类型**

```ts
// src/typings/api/print-format.d.ts
interface Template {
  id: number;
  categoryId: number;
  name: string;
  labelSize: string;
  isDefault: Api.Common.EnableStatus;
  generatedCount: number;
  remark: string;
  lastEditor: string;
  editTime: string;
  /** hiprint 模板 JSON 字符串，未设计时为空串 */
  designJson: string;
  /** 纸张尺寸，取值与 labelSize 一致，如 100×150mm */
  paperSize: string;
}
```

同步 `mockDb` 的 6 条初始数据补 `designJson: ''`、`paperSize: ''`（否则 TS 报错）。

- [ ] **Step 2: 新增两个接口（DEV 走内存 mock）**

```ts
// src/service/api/print-format.ts
/** 获取模板详情（含设计 JSON） */
export function fetchGetPrintTemplateDetail(id: number) {
  if (import.meta.env.DEV) {
    const row = mockDb.find(t => t.id === id);
    return Promise.resolve(row) as unknown as Promise<Api.PrintFormat.Template>;
  }
  return request<Api.PrintFormat.Template>({ url: '/print/template/detail', method: 'post', data: { id } });
}

/** 保存设计器产物 */
export function fetchSavePrintTemplateDesign(params: { id: number; designJson: string; paperSize: string }) {
  if (import.meta.env.DEV) {
    const row = mockDb.find(t => t.id === params.id);
    if (row) {
      row.designJson = params.designJson;
      row.paperSize = params.paperSize;
      row.lastEditor = 'admin';
      row.editTime = now();
    }
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/print/template/saveDesign', method: 'post', data: params });
}
```

同时给 `fetchCreatePrintTemplate` / `fetchCopyPrintTemplate` 落库时补 `designJson: ''`、`paperSize: ''`（`{ ...params, id, generatedCount: 0, ... }` 已继承 params，无需额外处理，确认即可）。

- [ ] **Step 3: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error。

- [ ] **Step 4: 提交**

摘要：`打印格式模板增加设计 JSON 与纸张字段并补充详情/保存接口`。

---

### Task 3: 路由页骨架、路由生成与 i18n

**Files:**

- Create: `src/views/system-manage/print-design/index.vue`
- Modify: `src/router/routes/index.ts:11`（`customRoutes`）
- Modify: `src/locales/langs/zh-cn.ts`、`src/locales/langs/en-us.ts`、`src/typings/app.d.ts`

**Interfaces:**

- Produces: 路由 `system-manage_print-design`（path `/system-manage/print-design`），被 Task 9 的列表跳转与 Task 7 的返回使用。

- [ ] **Step 1: 建页面骨架**

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { $t } from '@/locales';

const route = useRoute();
const templateId = Number(route.query.id ?? 0);
const templateName = String(route.query.name ?? '');
const paperSize = String(route.query.paperSize ?? '100×150mm');
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <div class="h-48px flex items-center gap-8px border-b border-#eee px-16px dark:border-#333">
      <NButton size="small" @click="$router.back()">{{ $t('page.manage.printDesign.back') }}</NButton>
      <span class="text-14px font-500">{{ templateName }}</span>
    </div>
    <div class="min-h-0 flex flex-1">
      <div class="w-240px shrink-0 overflow-auto border-r border-#eee dark:border-#333">
        {{ $t('page.manage.printDesign.fields') }}
      </div>
      <div class="min-w-0 flex-1 overflow-auto">{{ templateId }} / {{ paperSize }}</div>
      <div class="w-300px shrink-0 overflow-auto border-l border-#eee dark:border-#333">
        {{ $t('page.manage.printDesign.properties') }}
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 生成路由**

```powershell
$env:NODE_OPTIONS=""; pnpm gen-route
```

若 `sa gen-route` 进入交互式提问则退出，改用 `pnpm dev` 或 `pnpm build` 触发全量重生成（两者都会重跑 elegant-router 插件）。生成后确认 `src/router/elegant/routes.ts` 出现 `system-manage_print-design`，且 `src/typings/elegant-router.d.ts` 的 `RouteKey` 含该 key（**不要手改这些文件**）。

- [ ] **Step 3: 菜单隐藏**

```ts
// src/router/routes/index.ts
const customRoutes: CustomRoute[] = [
  {
    name: 'system-manage_print-design',
    meta: { title: 'page.manage.printDesign.title', hideInMenu: true, constant: false }
  }
];
```

- [ ] **Step 4: i18n 三处同步**

`zh-cn.ts` 的 `route` 段加 `'system-manage_print-design': '设计标签'`；`page.manage` 段新增：

```ts
        printDesign: {
          title: '设计标签',
          back: '返回上一页',
          paper: '纸张尺寸',
          zoomOut: '缩小',
          zoomIn: '放大',
          clear: '清空',
          clearConfirm: '确认清空',
          clearContent: '将删除画布上所有元素，确认继续？',
          save: '保存',
          preview: '预览',
          fields: '业务字段',
          basicElements: '基础元素',
          canvas: '设计画布',
          properties: '元素属性',
          print: '打印',
          loadFailed: '设计器加载失败',
          saveSuccess: '保存成功',
          noTemplate: '模板不存在'
        },
```

`en-us.ts` 同结构英文（`Design Label / Back / Paper Size / Zoom Out / Zoom In / Clear / Confirm Clear / ...`）。
`src/typings/app.d.ts` 在 `page.manage` 下（`printFormat` 之后）补同名结构，全部字段类型为 `string`。
另外 `zh-cn.ts` / `en-us.ts` / `app.d.ts` 还需要给 `printFormat` 增一个 `design` 键（`设计` / `Design`），Task 9 使用。

- [ ] **Step 5: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error（i18n key 缺失会在这里报出来）。再 `pnpm dev` 手测：浏览器直接访问 `http://localhost:9111/system-manage/print-design?id=1` 能看到三栏骨架。

- [ ] **Step 6: 提交**

摘要：`新增标签设计器路由页骨架与 i18n（菜单隐藏）`。

---

### Task 4: 字段常量、纸张常量与 hiprint 加载器

**Files:**

- Create: `src/views/system-manage/print-design/modules/print-fields.ts`
- Create: `src/views/system-manage/print-design/modules/paper-sizes.ts`
- Create: `src/views/system-manage/print-design/modules/use-hiprint.ts`

**Interfaces:**

- Consumes: Task 1 的 `declare module 'vue-plugin-hiprint'`。
- Produces: `printFieldGroups`、`buildSampleData()`、`paperOptions`、`parseLabelSize()`、`loadHiprint()`、`createDesignTemplate()`、`buildDraggableItems()`、`clearTemplate()`。Task 5–8 依赖。

- [ ] **Step 1: 字段常量**

```ts
// modules/print-fields.ts
export type PrintFieldType = 'text' | 'longText' | 'barcode' | 'qrcode' | 'table';

export interface PrintField {
  /** 绑定字段名，对应元素 options.field */
  key: string;
  /** 左侧面板展示名 */
  label: string;
  /** 生成的元素类型 */
  type: PrintFieldType;
  /** 设计态与预览用的示例值 */
  sample: string;
}

export interface PrintFieldGroup {
  key: string;
  label: string;
  fields: PrintField[];
}

export const printFieldGroups: PrintFieldGroup[] = [
  {
    key: 'waybill',
    label: '运单信息',
    fields: [
      { key: 'waybillNo', label: '运单号', type: 'barcode', sample: 'WM202609070001' },
      { key: 'transferNo', label: '转单号', type: 'text', sample: 'TR202609070001' },
      { key: 'channel', label: '渠道', type: 'text', sample: '中欧专线' },
      { key: 'country', label: '目的国家', type: 'text', sample: 'Germany' },
      { key: 'weight', label: '重量(kg)', type: 'text', sample: '2.35' },
      { key: 'createAt', label: '下单时间', type: 'text', sample: '2026-09-07 10:20' }
    ]
  },
  {
    key: 'receiver',
    label: '收件人信息',
    fields: [
      { key: 'receiverName', label: '收件人', type: 'text', sample: 'Hans Muller' },
      { key: 'receiverPhone', label: '收件电话', type: 'text', sample: '+49 170 1234567' },
      { key: 'receiverCompany', label: '收件公司', type: 'text', sample: 'Muller GmbH' },
      { key: 'receiverCountry', label: '国家/地区', type: 'text', sample: 'DE' },
      { key: 'receiverState', label: '省/州', type: 'text', sample: 'Bavaria' },
      { key: 'receiverCity', label: '城市', type: 'text', sample: 'Munich' },
      { key: 'receiverAddress1', label: '地址行1', type: 'longText', sample: 'Hauptstrasse 12' },
      { key: 'receiverAddress2', label: '地址行2', type: 'longText', sample: 'Apt. 3B' },
      { key: 'receiverPostcode', label: '邮编', type: 'text', sample: '80331' }
    ]
  },
  {
    key: 'sender',
    label: '发件人信息',
    fields: [
      { key: 'senderName', label: '发件人', type: 'text', sample: '林飞' },
      { key: 'senderPhone', label: '发件电话', type: 'text', sample: '13800138000' },
      { key: 'senderCompany', label: '发件公司', type: 'text', sample: 'LINFLY Logistics' },
      { key: 'senderAddress', label: '发件地址', type: 'longText', sample: '深圳市宝安区xxx工业园A栋' }
    ]
  },
  {
    key: 'goods',
    label: '物品信息',
    fields: [
      { key: 'goodsName', label: '品名', type: 'text', sample: 'LED Lamp' },
      { key: 'goodsQty', label: '数量', type: 'text', sample: '3' },
      { key: 'goodsWeight', label: '重量', type: 'text', sample: '2.35' },
      { key: 'declareValue', label: '申报价值', type: 'text', sample: '58.00' },
      { key: 'hsCode', label: '海关编码', type: 'text', sample: '9405409000' }
    ]
  },
  {
    key: 'fee',
    label: '费用信息',
    fields: [
      { key: 'freight', label: '运费', type: 'text', sample: '128.00' },
      { key: 'totalFee', label: '合计', type: 'text', sample: '186.50' },
      { key: 'currency', label: '币种', type: 'text', sample: 'EUR' }
    ]
  },
  {
    key: 'system',
    label: '系统信息',
    fields: [
      { key: 'printTime', label: '打印时间', type: 'text', sample: '2026-09-07 15:30:00' },
      { key: 'printUser', label: '打印人', type: 'text', sample: 'admin' },
      { key: 'qrcodeUrl', label: '查询二维码', type: 'qrcode', sample: 'https://example.com/w/WM202609070001' }
    ]
  }
];

/** 由字段示例值拼出预览/设计态的示例运单数据 */
export function buildSampleData(): Record<string, string> {
  const data: Record<string, string> = {};
  printFieldGroups.forEach(group => {
    group.fields.forEach(field => {
      data[field.key] = field.sample;
    });
  });
  return data;
}
```

- [ ] **Step 2: 纸张常量**

```ts
// modules/paper-sizes.ts
export interface PaperOption {
  label: string;
  width: number;
  height: number;
}

export const paperOptions: PaperOption[] = [
  { label: '100×150mm', width: 100, height: 150 },
  { label: '100×100mm', width: 100, height: 100 },
  { label: '80×60mm', width: 80, height: 60 },
  { label: '76×130mm', width: 76, height: 130 },
  { label: 'A4', width: 210, height: 297 }
];

/** 把 labelSize / paperSize 字符串解析为纸张尺寸，未命中时回退 100×150mm */
export function parseLabelSize(size: string): PaperOption {
  return paperOptions.find(item => item.label === size) ?? paperOptions[0];
}
```

- [ ] **Step 3: hiprint 加载器 + provider**

```ts
// modules/use-hiprint.ts
import type { defaultElementTypeProvider, hiprint, PrintElementType, PrintTemplate } from 'vue-plugin-hiprint';
import { printFieldGroups, type PrintFieldGroup } from './print-fields';

export interface HiprintApi {
  hiprint: typeof hiprint;
  PrintTemplate: new (options?: ConstructorParameters<typeof PrintTemplate>[0]) => PrintTemplate;
  PrintElementType: new (options: ConstructorParameters<typeof PrintElementType>[0]) => PrintElementType;
  defaultElementTypeProvider: new () => defaultElementTypeProvider;
}

let cached: Promise<HiprintApi> | null = null;

/**
 * 加载 hiprint。hiprint 内部依赖全局 $，必须先注入 jQuery 再加载插件，
 * 因此这里全部使用动态 import 保证执行顺序（静态 import 会被提升导致 jQuery is not defined）。
 */
export function loadHiprint(): Promise<HiprintApi> {
  if (!cached) {
    cached = (async () => {
      const { default: jquery } = await import('jquery');
      Object.assign(window, { $: jquery, jQuery: jquery });
      const mod = await import('vue-plugin-hiprint');
      mod.disAutoConnect();
      return {
        hiprint: mod.hiprint,
        PrintTemplate: mod.PrintTemplate,
        PrintElementType: mod.PrintElementType,
        defaultElementTypeProvider: mod.defaultElementTypeProvider
      } as HiprintApi;
    })();
  }
  return cached;
}

/** 业务字段 provider：把每个字段注册成一个可拖拽元素类型，拖入即带 field 绑定 */
export function createFieldProvider(api: HiprintApi) {
  const provider = {
    addElementTypes(context: Parameters<defaultElementTypeProvider['addElementTypes']>[0]) {
      printFieldGroups.forEach(group => {
        context.addPrintElementTypes(
          group.key,
          group.fields.map(
            field =>
              new api.PrintElementType({
                tid: `${group.key}.${field.key}`,
                title: field.label,
                type: field.type === 'longText' ? 'text' : field.type,
                options: { field: field.key, testData: field.sample, title: field.label }
              })
          )
        );
      });
    }
  };
  return provider;
}

/** 初始化 hiprint（默认元素 provider + 业务字段 provider） */
export async function initHiprint(): Promise<HiprintApi> {
  const api = await loadHiprint();
  api.hiprint.init({ providers: [new api.defaultElementTypeProvider(), createFieldProvider(api)] });
  return api;
}

/** 让所有 .ep-draggable-item 可拖拽；必须在面板 DOM 渲染完成（nextTick）后调用 */
export function buildDraggableItems(api: HiprintApi, root: HTMLElement | null) {
  if (!root) return;
  const items = root.querySelectorAll('.ep-draggable-item');
  if (items.length) {
    api.hiprint.PrintElementTypeManager.buildByHtml(window.jQuery(items));
  }
}

/** 创建设计器实例 */
export function createDesignTemplate(api: HiprintApi, template: unknown) {
  return new api.PrintTemplate({
    template,
    settingContainer: '#PrintElementOptionSetting',
    history: true,
    dataMode: 1
  });
}
```

> 说明：`window.jQuery` 需要类型支撑。`@types/jquery` 安装后在 `src/typings/hiprint.d.ts` 末尾补：
>
> ```ts
> declare global {
>   interface Window {
>     jQuery: typeof import('jquery');
>     $: typeof import('jquery');
>   }
> }
> ```
>
> 若 Step 2 的核对结果显示 `PrintElementType` 不支持 `options.testData`，改为只在 `options` 里传 `field` 与 `title`。

- [ ] **Step 4: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error。

- [ ] **Step 5: 提交**

摘要：`新增打印字段常量、纸张常量与 hiprint 动态加载器（含业务字段 provider）`。

---

### Task 5: 左侧字段面板

**Files:**

- Create: `src/views/system-manage/print-design/modules/field-panel.vue`

**Interfaces:**

- Consumes: `printFieldGroups`（Task 4）、`buildDraggableItems`（Task 4）。
- Produces: 组件 `FieldPanel`，Props `{ groups: PrintFieldGroup[]; basicElements: { tid: string; label: string }[] }`，Emits `ready`（DOM 渲染完成后触发，供父级调 `buildDraggableItems`）。

- [ ] **Step 1: 基础元素清单**

按 Task 1 Step 2 从 `node_modules` grep 出的 `defaultModule.*` 实际 tid 填写（下面为常见值，以核对结果为准）：

```ts
const basicElements = [
  { tid: 'defaultModule.text', label: '文本' },
  { tid: 'defaultModule.longText', label: '长文本' },
  { tid: 'defaultModule.image', label: '图片' },
  { tid: 'defaultModule.table', label: '表格' },
  { tid: 'defaultModule.tableCustom', label: '自定义表格' },
  { tid: 'defaultModule.hline', label: '横线' },
  { tid: 'defaultModule.vline', label: '竖线' },
  { tid: 'defaultModule.rect', label: '矩形' }
];
```

- [ ] **Step 2: 写组件**

```vue
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { $t } from '@/locales';
import type { PrintFieldGroup } from './print-fields';

interface BasicElement {
  tid: string;
  label: string;
}

defineProps<{
  groups: PrintFieldGroup[];
  basicElements: BasicElement[];
}>();

const emit = defineEmits<{ ready: [root: HTMLElement | null] }>();

const rootRef = ref<HTMLElement | null>(null);
const expanded = ref<string[]>([]);

onMounted(async () => {
  await nextTick();
  emit('ready', rootRef.value);
});

function toggle(key: string) {
  const index = expanded.value.indexOf(key);
  if (index >= 0) expanded.value.splice(index, 1);
  else expanded.value.push(key);
}
function isExpanded(key: string) {
  return expanded.value.includes(key);
}
</script>

<template>
  <div ref="rootRef" class="h-full w-full flex flex-col overflow-hidden">
    <NCollapse>
      <NCollapseItem
        v-for="group in groups"
        :key="group.key"
        :title="group.label"
        :name="group.key"
        @click="toggle(group.key)"
      >
        <div class="flex flex-col gap-4px">
          <div
            v-for="field in group.fields"
            :key="field.key"
            class="ep-draggable-item cursor-move rounded-4px px-8px py-4px text-12px hover:bg-#f2f3f5 dark:hover:bg-#333"
            :tid="`${group.key}.${field.key}`"
          >
            {{ field.label }}
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
    <div class="px-12px py-8px text-12px text-#999">{{ $t('page.manage.printDesign.basicElements') }}</div>
    <div class="min-h-0 flex-1 overflow-auto px-8px pb-8px">
      <div class="flex flex-col gap-4px">
        <div
          v-for="item in basicElements"
          :key="item.tid"
          class="ep-draggable-item cursor-move rounded-4px px-8px py-4px text-12px hover:bg-#f2f3f5 dark:hover:bg-#333"
          :tid="item.tid"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>
```

> 若 `NCollapse` 默认展开/收起与 `expanded` 维护冲突，改为直接用 `NCollapse` 受控（`v-model:expanded-names="expanded"`），删掉自定义 `toggle`/`isExpanded`。

- [ ] **Step 3: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error。

- [ ] **Step 4: 提交**

摘要：`新增设计器左侧字段与基础元素拖拽面板`。

---

### Task 6: 顶部工具栏

**Files:**

- Create: `src/views/system-manage/print-design/modules/tool-bar.vue`

**Interfaces:**

- Produces: 组件 `ToolBar`，Props `{ paperSize: string; scale: number }`，Emits `back`、`update:paperSize`、`zoom-out`、`zoom-in`、`clear`、`save`、`preview`。Task 7 依赖。

- [ ] **Step 1: 写组件**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import { paperOptions } from './paper-sizes';

defineProps<{ paperSize: string; scale: number }>();

const emit = defineEmits<{
  back: [];
  'update:paperSize': [value: string];
  'zoom-out': [];
  'zoom-in': [];
  clear: [];
  save: [];
  preview: [];
}>();

const options = paperOptions.map(item => ({ label: item.label, value: item.label }));
</script>

<template>
  <div class="h-48px w-full flex shrink-0 items-center gap-8px border-b border-#eee px-16px dark:border-#333">
    <NButton size="small" @click="emit('back')">
      <template #icon><icon-ic-round-arrow-back class="text-icon" /></template>
      {{ $t('page.manage.printDesign.back') }}
    </NButton>
    <NSelect
      class="w-140px"
      size="small"
      :value="paperSize"
      :options="options"
      @update:value="value => emit('update:paperSize', value)"
    />
    <div class="ml-8px flex items-center gap-4px">
      <NButton size="small" quaternary :title="$t('page.manage.printDesign.zoomOut')" @click="emit('zoom-out')">
        <template #icon><icon-ic-round-zoom-out class="text-icon" /></template>
      </NButton>
      <span class="w-48px text-center text-12px">{{ Math.round(scale * 100) }}%</span>
      <NButton size="small" quaternary :title="$t('page.manage.printDesign.zoomIn')" @click="emit('zoom-in')">
        <template #icon><icon-ic-round-zoom-in class="text-icon" /></template>
      </NButton>
    </div>
    <div class="flex-1"></div>
    <NButton size="small" @click="emit('clear')">{{ $t('page.manage.printDesign.clear') }}</NButton>
    <NButton size="small" @click="emit('preview')">{{ $t('page.manage.printDesign.preview') }}</NButton>
    <NButton type="primary" size="small" @click="emit('save')">{{ $t('page.manage.printDesign.save') }}</NButton>
  </div>
</template>
```

> `icon-ic-round-zoom-out` / `icon-ic-round-zoom-in` 若图标集里不存在，换成项目已用的图标名（如 `icon-ic-round-remove` / `icon-ic-round-add`）。

- [ ] **Step 2: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
```

Expected: 0 error。

- [ ] **Step 3: 提交**

摘要：`新增设计器顶部工具栏（返回/纸张/缩放/清空/保存/预览）`。

---

### Task 7: 设计器主页面装配

**Files:**

- Modify: `src/views/system-manage/print-design/index.vue`（替换 Task 3 的骨架）

**Interfaces:**

- Consumes: `initHiprint`、`createDesignTemplate`、`buildDraggableItems`（Task 4）、`FieldPanel`（Task 5）、`ToolBar`（Task 6）、`parseLabelSize`（Task 4）、`fetchGetPrintTemplateDetail`、`fetchSavePrintTemplateDesign`（Task 2）、`useRouterPush`（`src/hooks/common/router.ts`）。
- Produces: 完整可用设计器；Task 8 的预览由本页 `previewVisible` / `currentJson` 驱动。

- [ ] **Step 1: 写主页面**

```vue
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPrintTemplateDetail, fetchSavePrintTemplateDesign } from '@/service/api/print-format';
import FieldPanel from './modules/field-panel.vue';
import ToolBar from './modules/tool-bar.vue';
import PreviewModal from './modules/preview-modal.vue';
import { printFieldGroups } from './modules/print-fields';
import { paperOptions, parseLabelSize } from './modules/paper-sizes';
import { buildDraggableItems, createDesignTemplate, initHiprint, type HiprintApi } from './modules/use-hiprint';

const route = useRoute();
const { routerBack, routerPushByKey } = useRouterPush();

const templateId = Number(route.query.id ?? 0);
const templateName = String(route.query.name ?? '');

const paperSize = ref('100×150mm');
const scale = ref(1);
const loading = ref(false);
const saving = ref(false);
const previewVisible = ref(false);
const currentJson = ref('');

/** hiprint 实例与模板实例用 shallowRef，避免被深度代理 */
const apiRef = shallowRef<HiprintApi | null>(null);
const templateRef = shallowRef<ReturnType<typeof createDesignTemplate> | null>(null);

const basicElements = [
  { tid: 'defaultModule.text', label: $t('page.manage.printDesign.basicElements') + '-文本' },
  { tid: 'defaultModule.longText', label: '长文本' },
  { tid: 'defaultModule.image', label: '图片' },
  { tid: 'defaultModule.table', label: '表格' },
  { tid: 'defaultModule.hline', label: '横线' },
  { tid: 'defaultModule.vline', label: '竖线' },
  { tid: 'defaultModule.rect', label: '矩形' }
];

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

function handlePanelReady(root: HTMLElement | null) {
  const api = apiRef.value;
  if (!api) return;
  buildDraggableItems(api, root);
}

async function mountDesigner(designJson: string) {
  const api = await initHiprint();
  apiRef.value = api;
  let template: unknown = {};
  if (designJson) {
    try {
      template = JSON.parse(designJson) as unknown;
    } catch {
      template = {};
    }
  }
  const paper = parseLabelSize(paperSize.value);
  const instance = createDesignTemplate(api, template);
  instance.design('#hiprint-printTemplate');
  instance.setPaper(paper.width, paper.height);
  templateRef.value = instance;
}

onMounted(async () => {
  if (!templateId) {
    window.$message?.error($t('page.manage.printDesign.noTemplate'));
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchGetPrintTemplateDetail(templateId);
    paperSize.value = detail.paperSize || detail.labelSize || '100×150mm';
    await nextTick();
    await mountDesigner(detail.designJson);
    await nextTick();
    handlePanelReady(document.querySelector<HTMLElement>('.print-design-panel'));
  } catch {
    window.$message?.error($t('page.manage.printDesign.loadFailed'));
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  templateRef.value = null;
});

function handleBack() {
  routerBack();
  // 无历史时兜底回到系统设置页
  window.setTimeout(() => {
    if (window.location.pathname.includes('/system-manage/print-design')) {
      void routerPushByKey('system-manage_setting');
    }
  }, 0);
}

function handleZoom(delta: number) {
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((scale.value + delta).toFixed(1))));
  scale.value = next;
  templateRef.value?.zoom(next);
}

function handlePaperChange(value: string) {
  paperSize.value = value;
  const paper = parseLabelSize(value);
  templateRef.value?.setPaper(paper.width, paper.height);
}

function handleClear() {
  window.$dialog?.warning({
    title: $t('page.manage.printDesign.clearConfirm'),
    content: $t('page.manage.printDesign.clearContent'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const api = apiRef.value;
      const paper = parseLabelSize(paperSize.value);
      const instance = templateRef.value;
      // clear() 在部分版本不存在，缺失时改为销毁后重建实例
      if (instance && typeof instance.clear === 'function') {
        instance.clear();
      } else if (api) {
        const fresh = createDesignTemplate(api, {});
        fresh.design('#hiprint-printTemplate');
        fresh.setPaper(paper.width, paper.height);
        templateRef.value = fresh;
      }
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSave() {
  const instance = templateRef.value;
  if (!instance || !templateId) return;
  saving.value = true;
  try {
    currentJson.value = JSON.stringify(instance.getJson());
    await fetchSavePrintTemplateDesign({ id: templateId, designJson: currentJson.value, paperSize: paperSize.value });
    window.$message?.success($t('page.manage.printDesign.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

function handlePreview() {
  const instance = templateRef.value;
  if (!instance) return;
  currentJson.value = JSON.stringify(instance.getJson());
  previewVisible.value = true;
}

const paperWidth = computed(() => parseLabelSize(paperSize.value).width);
const paperCount = computed(() => paperOptions.length);
</script>
```

模板部分：

```vue
<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <ToolBar
      :paper-size="paperSize"
      :scale="scale"
      @back="handleBack"
      @update:paper-size="handlePaperChange"
      @zoom-out="handleZoom(-0.1)"
      @zoom-in="handleZoom(0.1)"
      @clear="handleClear"
      @save="handleSave"
      @preview="handlePreview"
    />
    <div class="min-h-0 flex flex-1">
      <div class="print-design-panel w-240px shrink-0 overflow-auto border-r border-#eee dark:border-#333">
        <FieldPanel :groups="printFieldGroups" :basic-elements="basicElements" @ready="handlePanelReady" />
      </div>
      <div class="min-w-0 flex-1 overflow-auto bg-#f5f5f5 p-16px dark:bg-#1f1f1f">
        <div id="hiprint-printTemplate"></div>
      </div>
      <div class="w-300px shrink-0 overflow-auto border-l border-#eee dark:border-#333">
        <div id="PrintElementOptionSetting"></div>
      </div>
    </div>
    <PreviewModal v-model:show="previewVisible" :design-json="currentJson" :paper-size="paperSize" />
  </div>
</template>
```

> 注意：`paperWidth` / `templateName` / `paperCount` / `loading` / `saving` 若最终未使用，删除以免 lint 报未使用变量（本项目 lint 会拦 `no-unused-vars`）。

- [ ] **Step 2: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
$env:NODE_OPTIONS=""; pnpm lint
```

Expected: 0 error。

- [ ] **Step 3: 提交**

摘要：`装配标签设计器主页面（画布挂载/缩放/纸张/清空/保存）`。

---

### Task 8: 预览与打印

**Files:**

- Create: `src/views/system-manage/print-design/modules/preview-modal.vue`

**Interfaces:**

- Consumes: `buildSampleData`（Task 4）、`loadHiprint`（Task 4）。
- Produces: 组件 `PreviewModal`，Props `{ show: boolean; designJson: string; paperSize: string }`，Emits `update:show`。

- [ ] **Step 1: 写组件**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import printLockCss from 'vue-plugin-hiprint/dist/print-lock.css?url';
import { $t } from '@/locales';
import { buildSampleData } from './print-fields';
import { loadHiprint } from './use-hiprint';

const props = defineProps<{ show: boolean; designJson: string; paperSize: string }>();
const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const html = ref('');
const frameRef = ref<HTMLIFrameElement | null>(null);

watch(
  () => [props.show, props.designJson],
  async ([show]) => {
    if (!show) return;
    const api = await loadHiprint();
    let template: unknown = {};
    if (props.designJson) {
      try {
        template = JSON.parse(props.designJson) as unknown;
      } catch {
        template = {};
      }
    }
    const instance = new api.PrintTemplate({ template });
    html.value = instance.getHtml(buildSampleData());
  }
);

/** getHtml 返回的是纸张片段，这里补全为完整文档后再注入 iframe */
function buildDocument(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><link rel="stylesheet" href="${printLockCss}" /></head><body>${html.value}</body></html>`;
}

function handlePrint() {
  frameRef.value?.contentWindow?.print();
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    class="w-800px"
    :title="$t('page.manage.printDesign.preview')"
    @update:show="value => emit('update:show', value)"
  >
    <div class="h-520px w-full overflow-auto bg-#f5f5f5">
      <iframe ref="frameRef" class="h-full w-full border-0" :srcdoc="buildDocument()"></iframe>
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton size="small" @click="emit('update:show', false)">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" size="small" @click="handlePrint">{{ $t('page.manage.printDesign.print') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
```

> `vue-plugin-hiprint/dist/print-lock.css?url` 若 vite 不能解析（dist 未在 exports 内），改为把该文件复制到 `public/print-lock.css`，然后在 `index.html` 加
> `<link rel="stylesheet" type="text/css" media="print" href="/print-lock.css" />`，组件里去掉 `printLockCss` 引用。

- [ ] **Step 2: 验证**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
$env:NODE_OPTIONS=""; pnpm lint
```

Expected: 0 error。

- [ ] **Step 3: 提交**

摘要：`新增设计器预览弹窗与浏览器打印`。

---

### Task 9: 列表接入与端到端验收

**Files:**

- Modify: `src/views/system-manage/setting/modules/PrintFormat.vue:260-266`（操作列）
- Modify: `src/views/system-manage/setting/modules/PrintFormat.vue:1-16`（import）

**Interfaces:**

- Consumes: `useRouterPush`（`src/hooks/common/router.ts`）、路由 `system-manage_print-design`（Task 3）。

- [ ] **Step 1: 列表加「设计」按钮**

```ts
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();

function openDesign(row: Api.PrintFormat.Template) {
  void routerPushByKey('system-manage_print-design', {
    query: { id: String(row.id), categoryId: String(row.categoryId), name: row.name, paperSize: row.paperSize }
  });
}
```

```vue
<template #action="{ row }">
  <NButton text type="primary" @click="openDesign(row)">{{ $t('page.manage.setting.printFormat.design') }}</NButton>
  <NButton text type="primary" @click="openView(row)">{{ $t('page.manage.setting.printFormat.view') }}</NButton>
  <NButton text type="primary" @click="openCopy(row)">{{ $t('page.manage.setting.printFormat.copy') }}</NButton>
  <NButton text type="primary" :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
    {{ $t('page.manage.setting.printFormat.setDefault') }}
  </NButton>
</template>
```

同时把 `:action-width="200"` 调大到 `260`（4 个按钮放得下）。

- [ ] **Step 2: 端到端手测**

```powershell
$env:NODE_OPTIONS=""; pnpm dev
```

逐项确认：

1. 系统设置 → 打印格式 → 任一行「设计」→ 进入设计器，顶部显示模板名与纸张；
2. 左侧展开「运单信息」→ 拖「运单号」到画布 → 出现条码元素 → 点元素右侧属性面板能改字号/边框；
3. 拖「收件人」等文本字段 → 属性面板「字段名」显示为 `receiverName`（证明 field 绑定成功）；
4. 缩放 +/- 与百分比联动，缩小到 50% 不再变小；
5. 纸张切到 A4 → 画布尺寸变化，已有元素保留；
6. 点「预览」→ 弹窗显示带示例数据的标签 → 点「打印」弹出浏览器打印对话框；
7. 点「保存」→ 提示成功 → 返回列表再进设计器，元素位置与上次一致（mock 持久化）；
8. 点「返回上一页」→ 回到设置页的打印格式 tab。

- [ ] **Step 3: 构建与提交**

```powershell
$env:NODE_OPTIONS=""; pnpm typecheck
$env:NODE_OPTIONS=""; pnpm lint
$env:NODE_OPTIONS=""; pnpm fmt
$env:NODE_OPTIONS=""; pnpm build:test
```

Expected: typecheck/lint 0 error，build 成功。再确认构建产物中 hiprint 相关代码**不在**入口 chunk（`dist/assets/index-*.js` 中搜不到 `hiprint`）。

```powershell
$env:NODE_OPTIONS=""; pnpm commit:zh
```

摘要：`打印格式列表接入设计器入口并完成端到端验收`。

- [ ] **Step 4: 补文档**

按仓库规则在 `changelog/标签打印模板设计器实现.md` 记录（页面位置避坑、jQuery 动态加载、provider 字段绑定、Task 1 的 API 核对结果、已知限制：暗黑模式下属性面板为浅色），并把链接追加到 `AGENTS_CHANGELOG.md` 最新日期分组顶部。

---

## Self-Review 结论

- Spec 覆盖：目标/范围（Task 1-9）、依赖集成（T1）、页面路由（T3）、界面三栏+工具栏（T5/T6/T7）、数据模型接口（T2）、字段 provider（T4/T5）、预览打印（T8）、风险（T1 核对 + 各任务注释）、验收（T9）均有对应任务。
- 无 TBD / 无「类似 Task N」：所有步骤均给出实际代码或实际命令。
- 类型一致性：`designJson` / `paperSize` / `fetchGetPrintTemplateDetail` / `fetchSavePrintTemplateDesign` / `printFieldGroups` / `buildSampleData` / `parseLabelSize` / `paperOptions` / `loadHiprint` / `initHiprint` / `createDesignTemplate` / `buildDraggableItems` / `HiprintApi` 在各任务间名称与签名一致。
