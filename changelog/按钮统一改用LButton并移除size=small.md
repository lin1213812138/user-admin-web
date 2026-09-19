# 按钮统一改用 LButton 并移除 size="small"

> 日期：2026-09-19
> 触发：用户要求「把按钮都都改成使用 LButton 组件，并且去掉 size=small」

## 背景与目标

项目已封装 `src/components/basic/LButton.vue`（基于 naive-ui `NButton`，默认档高度固定 32px、内置 tooltip/popconfirm、支持 `auth` 权限码）。此前大量页面/组件仍直接用 `<NButton size="small">`。本次目标：全量切换到 `LButton` 并去掉冗余的 `size="small"`。

## 实施方案（脚本化批量）

范围：`src/**` 下全部 `.vue` / `.ts` / `.js`（**排除** `components/basic/LButton.vue` 与 `components/custom/button-icon.vue` 自身封装），共 **93 个文件**。

1. **标签替换**：`<NButton` → `<LButton`、`</NButton>` → `</LButton`（正则 `<NButton\b` 用 `\b` 词边界，天然避开 `<NButtonGroup>` 不会被误改）；`.ts` 里 `h(NButton` → `h(LButton`。
2. **移除 size="small"**：仅针对 `<LButton` 起始标签内部（多行安全：`/<LButton\b([^>]*?)(\s+size="small")([^>]*?)>/g`），**不**动 `NCard` / `NTag` / `NInputNumber` / `NSelect` / `NRadioGroup` / `NInput` / `NTabs` 等非按钮组件上的 `size="small"`（这些不在本次范围，全仓有大量使用该属性）。
3. **清理显式导入**：9 个文件此前显式 `import { NButton, ... } from 'naive-ui'`（其余 naive 组件保留，仅剔除 `NButton` token；若剔除后为空则整行删除）。
4. **补 LButton 引入**：`.ts` 文件（仅 `plugins/app.ts`）用到 `h(LButton)`，补 `import LButton from '@/components/basic/LButton.vue';`（`.vue` 中 LButton 由 `unplugin-vue-components` 自动引入，无需补）。

## 例外（必须保留 NButton）

`views/system-manage/label-designer/modules/panels/tool-bar.vue` 两处 `<NButtonGroup>` 的**直接子按钮**保留为 `<NButton>`，未转 LButton。

**原因**：naive-ui 的 `ButtonGroup` 连体边框（去重合边框、圆角裁剪）依赖 CSS `.n-button-group .n-button:first-child` / `.n-button + .n-button`（后代 + 相邻兄弟选择器）。`LButton` 是包裹组件，其内部 `<button class="n-button">` 不再是 `.n-button-group` 的直接子元素 / 相邻兄弟，会导致连体外观失效、按钮变回各自独立带边框。因此 `NButtonGroup` 的直接子按钮必须保持 `NButton`。

## 顺带修复（既有问题，与本次范围相关）

- `src/typings/components.d.ts(160)` 有一条指向**不存在**文件 `LButton.bak.vue` 的陈旧生成条目（`const 'LButton.bak': ...`），阻塞 `typecheck` / `lint` / `build`。经确认 `src/components/basic/` 下并无 `LButton.bak.vue`，删除该陈旧条目后重新生成也不会再出现 → 项目恢复可构建。

## 踩坑

- 脚本初版用「`.ts` 含 LButton 即补 import」的逻辑，误给 `directives/auth.ts` 加了未使用的 `import LButton`（该文件 `LButton` 仅出现在 JSDoc 注释）→ `oxlint` 报 `no-unused-vars`，已删除。

## 验证

- `pnpm typecheck`：0 错误。
- `pnpm lint`：0 error（仅 `link.vue` 2 个既有 warning：`KeyboardEvent` / `MouseEvent` not defined，非本次引入）。
- `pnpm fmt`：待提交前执行（pre-commit 钩子要求）。

## 影响面

- 所有改用 LButton 的按钮：未传 `size` 且非 `text` 按钮高度由 naive small(28px)/默认(34px) 统一为 **32px**（LButton 默认档）；`text` 按钮高度不变。
- `NButtonGroup` 内按钮维持原 NButton 外观（默认 34px），与周边 32px 略有差异属预期（为保留连体外观的必要取舍）。
- 功能不变：LButton 透传全部 `NButton` props / 事件 / 插槽，并新增 `auth` / `tooltip` / `popconfirm` 能力。
