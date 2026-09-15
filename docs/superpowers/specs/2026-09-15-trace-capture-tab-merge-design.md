# 轨迹抓取配置：子 tab 与表格融合（同一卡片）设计

**日期**：2026-09-15
**关联记录**：[changelog/轨迹抓取配置tab与表格融合.md](../../../changelog/轨迹抓取配置tab与表格融合.md)

## 背景与问题

「系统设置 → 轨迹抓取配置」页（`src/views/system-manage/setting/modules/trace-capture/TraceCapture.vue`）的子 tab 与被内容割裂：

- 子 tab 被单独包在一张 `NCard`（`content-style` padding 8px + `mb-16px`）里；
- 表格区是组件根下的另一个 `div`，两块之间露出 16px 的灰色页面背景；
- `NTabPane` 全部为空占位，内容由外层按 `active` 用 `v-if` 渲染。

用户对照「系统设置 → 初始化数据」页（`InitData.vue`，图二）要求：**把 tab 栏和表格融合在一起**——tab 下仅一条分隔线，紧接工具栏、表格、分页，同处一张卡片、无灰色间隙。

## 方案

改为「单卡片 + 全高 `NTabs`」结构，对齐初始化数据页已验证的布局：

```
NCard（h-full，content padding 0，flex column，minHeight 0）
└ div（flex-1 min-h-0 overflow-hidden px-16 py-16）
   └ NTabs（line，flex column，height 100%）
      ├ NTabPane × 4（前 4 个子页同构，共用 TraceConfigTable，仅 category 不同）
      └ NTabPane（operation-trace → OperationTraceTable）
```

关键点：

1. 表格由「`NTabs` 外部按 `active` 用 `v-if` 渲染」移入各自的 `NTabPane` 内（与 `InitDataCategory` 用法一致）。naive-ui `NTabs` 默认 `display-directive="if"`，只渲染当前 pane，切换行为与改动前一致（重建组件并重新取数）。
2. 全高布局 CSS 三件套（`.trace-capture-tabs` → `display:flex; flex-direction:column; height:100%`；`.n-tabs-pane-wrapper` → `flex:1 1 auto; min-height:0`；`.n-tab-pane` → `height:100%`）照搬 `InitData.vue`，保证表格撑满卡片、内部滚动。
3. 前 4 个子页拆为 `configTabs` 数组（key 类型即 `Api.SystemManage.TraceCaptureCategory`），操作轨迹独立一个 `NTabPane`，二者共用一个 `type="line"` 的 `NTabs`。这样避免在模板中写 `t.key as Api.X` 断言（eslint `vue/no-undef-properties` 对模板里出现的 `Api.` 会误报未定义）。

## 不改动

- `TraceConfigTable.vue` / `OperationTraceTable.vue`、service、mock、i18n：零改动。本次**不涉及**工具栏按钮增减、勾选列、删除能力（用户明确"跟工具栏没关系"）。
- 设置页最外层 6 个 segment tab 与其下方内容之间的间隙：保持现状（与初始化数据页一致）。

## 验证

- `pnpm typecheck` 0 错误；单文件 oxfmt / oxlint / eslint 0 问题。
- `pnpm build` 通过。
- 无浏览器端到端（本地无后端会话），最终视觉效果由用户查看确认。
