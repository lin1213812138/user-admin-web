# 打印设计页右侧属性面板重写 — 设计文档（方案 D：混合）

> 日期：2026-09-11
> 关联讨论：[changelog/重写打印设计右侧属性面板.md](../changelog/%E9%87%8D%E5%86%99%E6%89%93%E5%8D%B0%E8%AE%BE%E8%AE%A1%E5%8F%B3%E4%BE%A7%E5%B1%9E%E6%80%A7%E9%9D%A2%E6%9D%BF.md)
> 状态：设计已确认（方案 D），待实现

## 0. 根因（为何推翻初版方案 A 与方案 B）

初版方案 A（纯 Naive 重建）建立在两个错误前提，本轮经 hiprint 源码定位后推翻：

1. **事件名错误（即用户报告的 bug）**：初版监听 `BuildCustomOptionSettingEventKey_<id>`。经 `vue-plugin-hiprint` 源码确认，元素选中实际触发 `getPrintElementSelectEventKey()`（内部 `PrintElementOptionSettingPanel` 构造时监听它 → `buildSetting` 构建面板）；`BuildCustomOptionSettingEventKey` 仅用于**纸张/页码等全局设置**，元素选中不会触发它 → 监听收不到 → 选中后右侧面板无反应。
2. **字段元数据混淆了两个 API**：初版以为 `getPrintElementOptionTabs()` 返回的 item 含 `type/title/options` 可用于重建。实际该 API 只按 `name` 从 `OptionItemManager` 取**共享 item 单例**（`t = getItem(t.name)`），item 上**只有 `name`**，没有 type/options。但另一条 API `getConfigOptions()` 返回的是**原始字段配置**（含 `name/type/title/options`），简单字段的 `type` 与下拉项完全可得。

⇒ 方案 B（Naive 壳 + 全部原生控件）可行但体验不统一；进一步确认后采用 **方案 D：简单字段用 Naive 控件、复杂字段用 hiprint 原生控件兜底**（既满足自定义诉求，又避免逆向专有控件）。

## 1. 背景与目标

打印设计页（`src/views/system-manage/print-design`）右侧属性面板当前 `settingContainer` 已移除，但初版的纯 Naive 重建不成立。

目标：选中画布元素后，右侧面板按 hiprint 自带分组（基础/样式/数据…）展示该元素**全部**可编辑属性：

- **简单字段**（text/textarea/number/select/checkbox/color/image）→ 用项目 Naive 控件渲染，统一风格 + 暗黑模式 + 可 i18n 标题；
- **复杂字段**（coordinate 坐标 / widthHeight 尺寸 / border 边框 / table 列配置 / 其它未知 type）→ 用 hiprint 原生 `item.createTarget()` 控件兜底，保证正确；
- 编辑实时写回画布并同步预览。

## 2. 数据源

- `element.getConfigOptions()` → `{ tabs: [{ name, options: [{ name, type?, title?, options?, hidden? }] }] }`：元素类型的**原始字段配置**，`type` 取值如 `text/textarea/number/select/checkbox/color/image/coordinate/widthHeight/border/table/未知`。
- `element.getPrintElementOptionTabs()` → 仅用于复杂字段：按其 item 的 `name` 匹配，取 manager 单例 item（含 `createTarget/setValue/getValue`）。

## 3. type → Naive 控件映射（简单字段）

| `type`                                           | Naive 控件                  | 说明                     |
| ------------------------------------------------ | --------------------------- | ------------------------ |
| `text`                                           | `NInput`                    | 单行文本                 |
| `textarea`                                       | `NInput`(`type="textarea"`) | 多行                     |
| `number`                                         | `NInputNumber`              | 数值（位置/尺寸/字号等） |
| `select`                                         | `NSelect`                   | 选项来自 `field.options` |
| `checkbox`                                       | `NSwitch`                   | 布尔开关                 |
| `color`                                          | `NColorPicker`              | 颜色（hex）              |
| `image`                                          | `NInput`                    | 图片 URL（后续可接上传） |
| 其它（coordinate/widthHeight/border/table/未知） | 原生 `createTarget` 兜底    | 见 §4                    |

## 4. 架构与数据流

```
画布点击元素 → hiprint 选中 → trigger(getPrintElementSelectEventKey_<id>, { printElement })
        ↓ use-hiprint.onElementSelect（修正事件名）
index.vue: currentElement = payload.printElement（shallowRef）
        ↓ props
PropertyPanel.vue:
   watch(currentElement) → 读 el.getConfigOptions().tabs（原始字段配置）
        → 渲染 NCollapse（每 tab 一个 NCollapseItem，title=mapTabTitle(tab.name)）
        → 每 option（过滤 hidden）：
            · type∈简单清单 → 渲染对应 Naive 控件，v-model=el.options[name]
                              change/blur → el.updateOption(name, value)
            · 其它           → 静态宿主 div；nextTick: item.createTarget(el, el.options, el.printElementType)
                              append dom[0]；item.setValue(初始化)；给 item.target 内 input/select/textarea
                              绑 change/input → el.updateOption(name, item.getValue())
取消/删除 → trigger('clearSettingContainer') → currentElement=null → 面板空态
```

关键 API（源码已确认）：

- `template.getPrintElementSelectEventKey(): string` → 正确的元素选中事件名。
- `element.getConfigOptions()` → 原始 tabs 配置（含 type/title/options）。
- `element.getPrintElementOptionTabs()` → item 单例列表（复杂字段原生渲染用）。
- `item.createTarget(element, element.options, element.printElementType)` → 返回 jQuery 对象，`[0]` 为原生 DOM。
- `item.setValue(...)` / `item.getValue()`：初始化 / 读值（按 hiprint 原生 `buildSetting` 规则：`columns`/`dataType` → `setValue(options[name], options, type)`；`coordinate`/`widthHeight` → `setValue(options)`；其余 → `setValue(options[name] || type[name])`）。
- `element.updateOption(name, value)` → 写回 `options[name]` + 重绘 + 广播 `hiprintTemplateDataChanged` → 预览/保存同步。
- **不调 `element.submitOption()`**：源码显示它依赖 `this.panel.printElements` 并会**批量改同类型其它选中元素**，有副作用。

## 5. 组件与文件改动

### 5.1 新建 `src/views/system-manage/print-design/modules/property-panel.vue`

- props：`element: HiprintPrintElement | null`。
- `element` 为 null → 空态（如「未选中元素，请在画布中选择」）。
- `watch(element, render, { immediate: true })`：
  - `render()`：
    - `tabs = element.getConfigOptions().tabs`；过滤 `!hidden`；建立 `name → item` 映射（来自 `getPrintElementOptionTabs`，按 `item.name` 匹配）。
    - 渲染 `NCollapse`；每 tab 一个 `NCollapseItem`（`title = mapTabTitle(tab.name)`）。
    - 每 `option`：
      - `type` ∈ 简单清单 → 渲染对应 Naive 控件，`v-model` 绑 `element.options[option.name]`，`change`/`blur` 回调 `element.updateOption(option.name, value)`（select 的 `options` 来自 `option.options`）。
      - 否则 → 静态宿主 div（`:ref` 映射，Vue 不管理其内部子节点）；`nextTick` 后 `item.createTarget(element, element.options, element.printElementType)` 把 `dom[0]` append；`item.setValue(...)` 初始化；给 `item.target` 内 `input,select,textarea` 绑 `change input` → `element.updateOption(option.name, item.getValue())`。
  - **复杂字段宿主 div** 用静态 ref 映射（非 v-for 子节点），确保 Vue 不触碰其内部子节点，避免与 jQuery `append` 冲突；切换元素时整体 `innerHTML=''` 即可安全清理（item 是全局单例，`createTarget` 覆盖 `item.target`，旧 DOM 移除后无残留事件）。
- 容器 `NScrollbar` 包裹，暗黑模式跟随主题变量，与左右栏风格统一。

### 5.2 改 `src/views/system-manage/print-design/modules/use-hiprint.ts`

- `onElementSelect`：**改监听 `template.getPrintElementSelectEventKey()`**（修正根因①），移除 `getBuildCustomOptionSettingEventKey`。
- `onElementClear`：不变（监听 `clearSettingContainer`）。

### 5.3 改 `src/views/system-manage/print-design/index.vue`

- 第 9、363 行已 `import PropertyPanel` 并 `<PropertyPanel :element="currentElement" />`，但 `property-panel.vue` **当前缺失**（git 无记录），项目处于 broken 状态。方案 D 需**创建该文件**使引用恢复有效，其余逻辑（currentElement、监听注册）已就位，无需大改。

### 5.4 改 `src/typings/hiprint.d.ts`

- `PrintTemplate` 补 `getPrintElementSelectEventKey(): string`。
- `HiprintPrintElement` 补 `getConfigOptions(): { tabs: Array<{ name: string; options: Array<{ name: string; type?: string; title?: string; options?: unknown[]; hidden?: boolean }> }> }`。
- 新增 `HiprintOptionItem` 最小接口：`name: string; createTarget(element: unknown, options: unknown, printElementType: unknown): unknown; setValue(value: unknown, options?: unknown, printElementType?: unknown): void; getValue(): unknown; target?: unknown`（避免 `any`）。

### 5.5 CSS

- 简单字段由 Naive 自带样式（统一风格 + 暗黑 + i18n），无需额外覆盖。
- 复杂字段原生控件恢复美化 CSS（之前删除的 ~127 行针对 `.hiprint-option-item*` 及内部 `input/select/textarea/label`），作用域限定右栏根类（如 `.print-design-property-panel`），兼容暗黑模式（`.dark` 覆盖），避免污染全局。

### 5.6 i18n

- `src/locales/langs/zh-cn.ts` / `en-us.ts` 新增 `page.manage.printDesign.tab.basic`、`...tab.style` 等常见分组名（basic/style/common/data…）；`mapTabTitle(name)`：`TAB_TITLE_I18N[name] ?? name`（fallback 原中文）。同步 `typings/app.d.ts`。
- 字段标题：优先 `option.title`（hiprint 自带中文），不强制逐一 i18n。

## 6. 边界处理

- **多选（框选）**：本期以「最后选中的单个元素」驱动面板；多选批量编辑留作后续增强。
- **复杂字段**：coordinate/widthHeight/border/table 等由 hiprint 原生控件自带交互，方案 D 直接渲染其 `createTarget` DOM，无需降级占位；个别 item 渲染异常用 `try/catch` 跳过该 item，不阻断其它字段。
- **tab 标题**：本地映射 + fallback（见 §5.6）。
- **隐藏原生面板**：`settingContainer` 已移除，无需 `display:none` 占位。

## 7. 验证

- `pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过。
- 手动：拖入文本框 → 选中 → 右侧出现全部字段（标题/字段/字体/颜色用 Naive；坐标/尺寸/边框用原生控件）→ 改标题/字号/颜色（Naive 控件）→ 画布即时同步 → 预览一致；切换不同元素面板刷新；删除元素面板回空态。

## 8. 风险

- hiprint 内部 API（`getConfigOptions` 结构、`createTarget`/`setValue` 签名）随版本变化，升级依赖时需回归本面板。
- 原生控件 DOM 与 Vue 响应式混用，须严格管理宿主 div 的 `innerHTML` 清理，防止事件泄漏 / 重复 append。
