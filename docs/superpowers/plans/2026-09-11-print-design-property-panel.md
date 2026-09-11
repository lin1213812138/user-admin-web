# 打印设计属性面板（方案 D 混合）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 选中画布元素后，右侧面板用 Naive 控件渲染简单字段、hiprint 原生控件渲染复杂字段，编辑实时写回画布；修正选中事件名使面板在选中后真正刷新。

**Architecture:** 监听 hiprint 正确的元素选中事件 `getPrintElementSelectEventKey()` → `index.vue` 的 `currentElement` → `PropertyPanel.vue` 读取 `element.getConfigOptions()` 原始字段配置；`type ∈ 简单清单` 的字段用 Naive 控件、`v-model` 绑 `element.options[name]`、`updateOption` 写回；其余字段用 hiprint 原生 `item.createTarget()` 渲染到宿主 div，写回同样走 `updateOption`。不调 `submitOption`（有批量副作用）。

**Tech Stack:** Vue 3 `<script setup>` + Naive UI（`NCollapse`/`NInput`/`NInputNumber`/`NSelect`/`NSwitch`/`NColorPicker`/`NScrollbar`/`NEmpty`）、`vue-plugin-hiprint`、TypeScript、项目 i18n（`@/locales` + `typings/app.d.ts` 手写 Schema）。

## 测试策略（本任务）

本任务是前端 UI 重写，仓库目前无组件单测基建。按计划以 **`pnpm typecheck` + `pnpm lint` + `pnpm build`** 作为每个 task 的可独立验证 gate（等价于「运行测试通过」），最终以 **手动浏览器验证清单** 收尾（见 Task 6）。纯逻辑（type→控件判定、tab 标题映射、字段分类）以组件内导出函数形式存在，便于后续补单测；本期不搭建测试基建（YAGNI）。

## Global Constraints

- 所有内容一律**中文**（设计文档、注释、commit 说明）；库 API / 变量名 / 技术名词保留英文。
- 只用 **pnpm**，禁止 npm/yarn。
- i18n 新增键必须同步 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`（手写 `Schema` 类型），否则 typecheck 报 key 不存在。
- 写回只能用 `element.updateOption(name, value)`；**禁止 `element.submitOption()`**（源码显示会批量改同类型其它选中元素）。
- 复杂字段（coordinate/widthHeight/border/table/未知 type）走 hiprint 原生 `item.createTarget()` 兜底，不强行 Naive 化。
- 暗黑模式兼容：样式跟随主题变量，原生控件 CSS 需加 `.dark` 覆盖。
- **不主动 `git commit`**（用户明确要求）。每个 task 末尾的「Commit」改为「运行验证」，改动留在工作区，待用户要求再提交。
- 选中事件名必须用 `template.getPrintElementSelectEventKey()`（非 `BuildCustomOptionSettingEventKey`）。

## 文件结构

- **修改 `src/typings/hiprint.d.ts`**：补 `PrintTemplate.getPrintElementSelectEventKey()`、`HiprintPrintElement.getConfigOptions()`、新增 `HiprintOptionItem` 最小接口。所有任务依赖此类型基础。
- **修改 `src/views/system-manage/print-design/modules/use-hiprint.ts`**：`onElementSelect` 改监听正确事件名（根因修复）。
- **修改 `src/locales/langs/zh-cn.ts` / `en-us.ts` + `src/typings/app.d.ts`**：`printDesign` 下新增 `tab.basic` / `tab.style` / `tab.common` / `tab.data` 等分组标题键。
- **新建 `src/views/system-manage/print-design/modules/property-panel.vue`**：混合渲染核心组件（Task 4 简单字段 + Task 5 复杂字段/CSS）。
- **修改 `src/views/system-manage/print-design/index.vue`**：第 9 行已 `import PropertyPanel`、第 363 行已使用，文件创建后引用即恢复有效；本任务不改动（spec §5.3 已确认逻辑就位）。

---

### Task 1: 补全 hiprint 类型声明

**Files:**

- Modify: `src/typings/hiprint.d.ts`（`PrintTemplate` 类、`HiprintPrintElement` 接口、新增 `HiprintOptionItem`）

**Interfaces:**

- Consumes: 无（纯类型声明）
- Produces: `PrintTemplate.getPrintElementSelectEventKey()`、`HiprintPrintElement.getConfigOptions()`、`HiprintOptionItem`（Task 2/4/5 依赖）

- [ ] **Step 1: 在 `PrintTemplate` 类内补选中事件名方法**

在 `hiprint.d.ts` 的 `PrintTemplate` 类（约第 117 行 `getBuildCustomOptionSettingEventKey` 下方）新增：

```ts
    /** 返回元素选中的事件名（含 templateId），监听它才能拿到选中元素；注意区别于 getBuildCustomOptionSettingEventKey（仅用于纸张/页码等全局设置） */
    getPrintElementSelectEventKey(): string;
```

- [ ] **Step 2: 在 `HiprintPrintElement` 接口补 `getConfigOptions`**

在 `HiprintPrintElement`（约第 78 行 `getPrintElementOptionTabs` 下方）新增：

```ts
    /** 元素类型的原始字段配置（含 type/title/options），简单字段可据此重建控件 */
    getConfigOptions(): {
      tabs: Array<{
        name: string;
        options?: Array<{
          name: string;
          type?: string;
          title?: string;
          options?: unknown[];
          hidden?: boolean;
        }>;
      }>;
    };
```

- [ ] **Step 3: 新增 `HiprintOptionItem` 最小接口**

在 `HiprintPrintElement` 接口之前（或文件任意顶层）新增：

```ts
/** 属性字段原生控件 item（共享单例，来自 OptionItemManager）。复杂字段用其 createTarget 渲染原生控件 */
export interface HiprintOptionItem {
  /** 字段键，对应 element.options 上的属性名 */
  name: string;
  /** 生成原生控件 DOM（返回 jQuery 对象，[0] 为原生节点） */
  createTarget(element: unknown, options: unknown, printElementType: unknown): unknown;
  /** 初始化控件值 */
  setValue(value: unknown, options?: unknown, printElementType?: unknown): void;
  /** 读取控件当前值 */
  getValue(): unknown;
  /** 上一次 createTarget 生成的 DOM 根（jQuery 对象） */
  target?: unknown;
}
```

- [ ] **Step 4: 验证**

Run: `pnpm typecheck`
Expected: PASS（无类型错误；`getPrintElementSelectEventKey` / `getConfigOptions` / `HiprintOptionItem` 现在可被引用）

---

### Task 2: 修正选中事件名（根因修复）

**Files:**

- Modify: `src/views/system-manage/print-design/modules/use-hiprint.ts:189-202`（`onElementSelect` 函数）

**Interfaces:**

- Consumes: `PrintTemplate.getPrintElementSelectEventKey()`（Task 1）
- Produces: 修正后的 `onElementSelect`，选中后正确回调（被 `index.vue` 调用）

- [ ] **Step 1: 改 `onElementSelect` 监听正确事件名并修正注释**

把 `use-hiprint.ts` 第 189-202 行的 `onElementSelect` 整体替换为：

```ts
/**
 * 监听画布元素选中。hiprint 选中元素时会 trigger(`<PrintElementSelectEventKey>_<id>`, { printElement })，
 * 通过 template.getPrintElementSelectEventKey() 取正确事件名并绑定，payload 内含 printElement 实例。
 * （注意：getBuildCustomOptionSettingEventKey 只用于纸张/页码等全局设置，元素选中不会触发它。）
 * 返回取消监听函数（卸载时调用，避免事件累积）。
 */
export function onElementSelect(template: PrintTemplate, cb: (el: HiprintPrintElement) => void): () => void {
  const key = template.getPrintElementSelectEventKey();
  const handler = (payload: unknown) => {
    const el = (payload as { printElement?: HiprintPrintElement }).printElement;
    if (el) cb(el);
  };
  window.hinnn?.event.on(key, handler);
  return () => window.hinnn?.event.clear(key);
}
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck`
Expected: PASS（`getPrintElementSelectEventKey` 已声明；`index.vue` 对 `onElementSelect` 的调用无需改动）

---

### Task 3: 新增 tab 标题 i18n 键

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`（约第 463 行 `printDesign` 对象内）
- Modify: `src/locales/langs/en-us.ts`（约第 467 行 `printDesign` 对象内）
- Modify: `src/typings/app.d.ts`（约第 736 行 `printDesign` Schema 内）

**Interfaces:**

- Consumes: 无
- Produces: `page.manage.printDesign.tab.basic` / `tab.style` / `tab.common` / `tab.data` 等键（Task 4 的 `mapTabTitle` 使用）

- [ ] **Step 1: 在 `zh-cn.ts` 的 `printDesign` 增加 tab 标题键**

在 `printDesign: {` 块内（如 `zoomOut` 之后）新增：

```ts
        tab: {
          basic: '基础',
          style: '样式',
          common: '通用',
          data: '数据'
        },
```

- [ ] **Step 2: 在 `en-us.ts` 的 `printDesign` 增加对应键**

```ts
        tab: {
          basic: 'Basic',
          style: 'Style',
          common: 'Common',
          data: 'Data'
        },
```

- [ ] **Step 3: 在 `typings/app.d.ts` 的 `printDesign` Schema 增加对应键**

在 `printDesign: {` 块内（与 zh-cn/en-us 结构一致）新增：

```ts
tab: {
  basic: string;
  style: string;
  common: string;
  data: string;
}
```

- [ ] **Step 4: 验证**

Run: `pnpm typecheck`
Expected: PASS（`printDesign.tab.basic` 等键在 Schema 中存在，可被 `$t` 引用）

---

### Task 4: 新建 PropertyPanel 组件（简单字段 Naive 渲染）

**Files:**

- Create: `src/views/system-manage/print-design/modules/property-panel.vue`

**Interfaces:**

- Consumes: `HiprintPrintElement.getConfigOptions()`（Task 1）、`page.manage.printDesign.tab.*`（Task 3）、`@/locales` 的 `$t`
- Produces: 混合格式面板：简单字段 Naive 控件 + 复杂字段占位宿主 div；`element.updateOption` 写回

- [ ] **Step 1: 创建组件骨架 + 简单字段渲染（不含复杂字段原生控件）**

写入 `property-panel.vue` 完整内容（复杂字段先渲染占位宿主 div，Task 5 再填充原生控件）：

```vue
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import {
  NCollapse,
  NCollapseItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NColorPicker,
  NScrollbar,
  NEmpty
} from 'naive-ui';
import type { HiprintPrintElement, HiprintOptionItem } from 'vue-plugin-hiprint';
import { $t } from '@/locales';

const props = defineProps<{ element: HiprintPrintElement | null }>();

/** 简单字段 type 清单：用 Naive 控件渲染；其余走原生兜底 */
const SIMPLE_TYPES = new Set(['text', 'textarea', 'number', 'select', 'checkbox', 'color', 'image']);

/** tab 标题本地映射（i18n key 已在 typings/app.d.ts 同步） */
const TAB_TITLE_I18N: Record<string, string> = {
  basic: 'page.manage.printDesign.tab.basic',
  style: 'page.manage.printDesign.tab.style',
  common: 'page.manage.printDesign.tab.common',
  data: 'page.manage.printDesign.tab.data'
};
function mapTabTitle(name: string): string {
  const key = TAB_TITLE_I18N[name];
  return key ? $t(key) : name;
}

interface FieldDef {
  name: string;
  type?: string;
  title?: string;
  options?: Array<Record<string, unknown>>;
  hidden?: boolean;
}

const tabs = ref<{ name: string; fields: FieldDef[] }[]>([]);
const itemMap = new Map<string, HiprintOptionItem>();
const nativeHosts = ref<Record<string, HTMLElement | null>>({});

function buildTabs(el: HiprintPrintElement) {
  const cfg = el.getConfigOptions?.() as { tabs?: Array<{ name: string; options?: FieldDef[] }> } | undefined;
  const rawTabs = cfg?.tabs ?? [];
  tabs.value = rawTabs.map(t => ({
    name: t.name,
    fields: (t.options ?? []).filter(f => !f.hidden)
  }));
  // 收集复杂字段 item 单例（按 name 匹配），供 Task 5 原生渲染
  itemMap.clear();
  const raw = el.getPrintElementOptionTabs() as unknown;
  const list = Array.isArray(raw)
    ? (raw as Array<{ list?: HiprintOptionItem[] }>)
    : ((raw as { tabs?: Array<{ list?: HiprintOptionItem[] }> })?.tabs ?? []);
  list.forEach(tab => (tab.list ?? []).forEach(it => itemMap.set(it.name, it)));
  nativeHosts.value = {};
  tabs.value.forEach(tab =>
    tab.fields.forEach(f => {
      if (!SIMPLE_TYPES.has(f.type ?? '')) nativeHosts.value[f.name] = null;
    })
  );
}

/** 写回当前元素单个属性 */
function updateField(name: string, value: unknown) {
  props.element?.updateOption(name, value);
}

/** 把 hiprint 的 select options（{title|label, value}）转成 NSelect 所需结构 */
function toNSelectOptions(opts?: Array<Record<string, unknown>>) {
  return (opts ?? []).map(o => ({
    label: String(o.title ?? o.label ?? o.value ?? ''),
    value: o.value as string | number
  }));
}

watch(
  () => props.element,
  el => {
    if (!el) {
      tabs.value = [];
      nativeHosts.value = {};
      return;
    }
    buildTabs(el);
    // Task 5 在此处 nextTick 渲染原生复杂字段
  },
  { immediate: true }
);
</script>

<template>
  <div class="print-design-property-panel h-full">
    <NScrollbar v-if="element" class="h-full">
      <NCollapse :default-expanded-names="tabs.map(t => t.name)" class="pd-prop-collapse">
        <NCollapseItem v-for="tab in tabs" :key="tab.name" :name="tab.name" :title="mapTabTitle(tab.name)">
          <div class="pd-prop-field" v-for="field in tab.fields" :key="field.name">
            <div class="pd-prop-label">{{ field.title || field.name }}</div>

            <!-- 简单字段：Naive 控件 -->
            <NInput
              v-if="field.type === 'text' || field.type === 'image'"
              :value="(element.options[field.name] as string) || ''"
              @update:value="v => updateField(field.name, v)"
            />
            <NInput
              v-else-if="field.type === 'textarea'"
              type="textarea"
              :value="(element.options[field.name] as string) || ''"
              @update:value="v => updateField(field.name, v)"
            />
            <NInputNumber
              v-else-if="field.type === 'number'"
              class="w-full"
              :value="(element.options[field.name] as number) ?? 0"
              @update:value="v => updateField(field.name, v)"
            />
            <NSelect
              v-else-if="field.type === 'select'"
              :value="element.options[field.name] as string | number"
              :options="toNSelectOptions(field.options)"
              @update:value="v => updateField(field.name, v)"
            />
            <NSwitch
              v-else-if="field.type === 'checkbox'"
              :checked-value="true"
              :unchecked-value="false"
              :value="(element.options[field.name] as boolean) ?? false"
              @update:value="v => updateField(field.name, v)"
            />
            <NColorPicker
              v-else-if="field.type === 'color'"
              :value="(element.options[field.name] as string) || '#000000'"
              @update:value="v => updateField(field.name, v)"
            />

            <!-- 复杂字段：原生控件宿主（Task 5 渲染） -->
            <div v-else :ref="(node: any) => (nativeHosts[field.name] = node)" class="pd-native-host" />
          </div>
        </NCollapseItem>
      </NCollapse>
    </NScrollbar>

    <NEmpty v-else description="未选中元素，请在画布中选择" class="pd-prop-empty" />
  </div>
</template>
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS（无类型 / lint 错误；`index.vue` 对 `PropertyPanel` 的 import 与 `<PropertyPanel :element="currentElement" />` 现在可解析，broken 状态解除）

---

### Task 5: 复杂字段原生渲染 + 美化 CSS

**Files:**

- Modify: `src/views/system-manage/print-design/modules/property-panel.vue`（补充 `renderNativeFields` + `nextTick` 调用 + 样式）
- （样式写入同一文件的 `<style scoped>` 或 `<style>`；作用域限定 `.print-design-property-panel`）

**Interfaces:**

- Consumes: `HiprintOptionItem.createTarget/setValue/getValue`（Task 1）、`nativeHosts`（Task 4）、`itemMap`（Task 4 `buildTabs`）
- Produces: 复杂字段用 hiprint 原生控件渲染并写回；面板视觉接近 Naive

- [ ] **Step 1: 在 `<script setup>` 增加原生字段渲染函数并接入 watch**

在 `property-panel.vue` 的 `updateField` 之后新增：

```ts
/** 渲染复杂字段：用 hiprint 原生 item.createTarget 生成控件，change/input 时写回 */
function renderNativeFields(el: HiprintPrintElement) {
  tabs.value.forEach(tab =>
    tab.fields.forEach(field => {
      if (SIMPLE_TYPES.has(field.type ?? '')) return;
      const host = nativeHosts.value[field.name];
      const item = itemMap.get(field.name);
      if (!host || !item) return;
      try {
        host.innerHTML = '';
        const dom = (item as unknown as HiprintOptionItem).createTarget(
          el,
          el.options,
          (el as { printElementType?: unknown }).printElementType
        ) as ArrayLike<Element>;
        host.appendChild(dom[0]);

        // 按 hiprint 原生 buildSetting 规则初始化值
        const val = el.options[field.name];
        const type = (el as { printElementType?: Record<string, unknown> }).printElementType;
        if (field.name === 'columns' || field.name === 'dataType') {
          (item as unknown as HiprintOptionItem).setValue(val, el.options, type);
        } else if (field.name === 'coordinate' || field.name === 'widthHeight') {
          (item as unknown as HiprintOptionItem).setValue(el.options);
        } else {
          (item as unknown as HiprintOptionItem).setValue(val ?? type?.[field.name]);
        }

        host.querySelectorAll('input,select,textarea').forEach(node => {
          node.addEventListener('change', () =>
            el.updateOption(field.name, (item as unknown as HiprintOptionItem).getValue())
          );
          node.addEventListener('input', () =>
            el.updateOption(field.name, (item as unknown as HiprintOptionItem).getValue())
          );
        });
      } catch (e) {
        console.warn('[property-panel] 原生字段渲染失败:', field.name, e);
      }
    })
  );
}
```

把 `watch` 回调的注释处补上 `nextTick` 调用（复杂字段宿主 div 已挂载后再渲染）：

```ts
buildTabs(el);
nextTick(() => renderNativeFields(el));
```

并在 `<script setup>` 顶部 import 中补充 `nextTick`（已在 Task 4 的 import 列表中存在，确认包含即可）。

- [ ] **Step 2: 在组件内追加样式（作用域限定右栏，兼容暗黑）**

在 `property-panel.vue` 末尾添加（scoped 限制 `.print-design-property-panel`，避免污染全局）：

```vue
<style scoped>
.print-design-property-panel {
  padding: 12px;
  font-size: 13px;
}
.pd-prop-collapse {
  --n-title-font-size: 13px;
}
.pd-prop-field {
  margin-bottom: 12px;
}
.pd-prop-label {
  margin-bottom: 4px;
  color: var(--n-text-color-2);
}
.pd-prop-empty {
  padding-top: 40px;
}
/* 原生控件宿主：让 hiprint 生成的 .hiprint-option-item* 外观接近 Naive */
.pd-native-host :deep(.hiprint-option-item) {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.pd-native-host :deep(.hiprint-option-item > div:first-child) {
  width: 80px;
  flex-shrink: 0;
  color: var(--n-text-color-2);
}
.pd-native-host :deep(.hiprint-option-item input),
.pd-native-host :deep(.hiprint-option-item select),
.pd-native-host :deep(.hiprint-option-item textarea) {
  flex: 1;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--n-border-color);
  border-radius: 3px;
  background: var(--n-color);
  color: var(--n-text-color-1);
  outline: none;
  box-sizing: border-box;
}
.pd-native-host :deep(.hiprint-option-item input:focus),
.pd-native-host :deep(.hiprint-option-item select:focus),
.pd-native-host :deep(.hiprint-option-item textarea:focus) {
  border-color: var(--n-color-target);
}
:deep(.dark) .pd-native-host :deep(.hiprint-option-item input),
:deep(.dark) .pd-native-host :deep(.hiprint-option-item select),
:deep(.dark) .pd-native-host :deep(.hiprint-option-item textarea) {
  background: #1e1e1e;
}
</style>
```

- [ ] **Step 3: 验证**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS（无类型 / lint 错误；复杂字段宿主 div 在切换元素时由 `buildTabs` 重置 `nativeHosts` 并在 `renderNativeFields` 内 `host.innerHTML=''` 清理，避免事件泄漏）

---

### Task 6: 集成验证（build + 手测清单）

**Files:** 无新增文件（验证阶段）

**Interfaces:** Consumes: 全部前置任务产出

- [ ] **Step 1: 构建**

Run: `pnpm build`
Expected: PASS（生产构建成功，无类型/打包错误）

- [ ] **Step 2: 手测清单（需 `pnpm dev` 在浏览器验证，本任务不自动执行）**

按 spec §7 验证：

1. 拖入文本框 → 选中 → 右侧出现全部字段（标题/字段/字体/颜色用 Naive；坐标/尺寸/边框用原生控件）。
2. 改标题 / 字号 / 颜色（Naive 控件）→ 画布**即时**同步（无「确定」按钮）。
3. 切换不同元素 → 面板正确刷新（无旧元素残留）。
4. 删除元素 / 取消选中 → 面板回到「未选中元素」空态。
5. 暗黑模式下原生控件背景/边框可见、不刺眼。

- [ ] **Step 3: 运行验证（替代 commit）**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: 三者均 PASS。改动留在工作区，**不主动 git commit**（用户明确要求）；待用户要求再提交。

---

## Self-Review

**1. Spec coverage（spec §5 各条 → task）**

- §5.1 新建 property-panel.vue → Task 4 + Task 5 ✅
- §5.2 use-hiprint 改事件名 → Task 2 ✅
- §5.3 index.vue 引用恢复（文件创建即恢复）→ Task 4 创建文件 ✅
- §5.4 hiprint.d.ts 类型补全 → Task 1 ✅
- §5.5 CSS 美化（限定右栏 + 暗黑）→ Task 5 Step 2 ✅
- §5.6 i18n tab 标题 → Task 3 ✅
- §6 边界（多选单元素 / 复杂字段 try-catch / tab 标题 fallback / 隐藏原生面板）→ Task 4（mapTabTitle fallback）+ Task 5（try-catch）✅
- §7 验证 → Task 6 ✅

**2. Placeholder scan**：无 TBD/“implement later”/“add validation”等；每步均含实际代码或命令。

**3. Type consistency**：

- `getPrintElementSelectEventKey()`：Task 1 声明、Task 2 引用，签名一致 ✅
- `HiprintOptionItem`：Task 1 定义、`createTarget/setValue/getValue/target` 在 Task 5 引用，名称一致 ✅
- `getConfigOptions()`：Task 1 声明、Task 4 `buildTabs` 引用，返回结构一致 ✅
- `nativeHosts` / `itemMap` / `SIMPLE_TYPES`：Task 4 定义、Task 5 复用，名称一致 ✅
- i18n key `page.manage.printDesign.tab.*`：Task 3 三处同步、Task 4 `mapTabTitle` 引用，一致 ✅
