# 轨迹抓取配置：子 tab 与表格融合（同一卡片）

日期：2026-09-15
设计文档：[docs/superpowers/specs/2026-09-15-trace-capture-tab-merge-design.md](../docs/superpowers/specs/2026-09-15-trace-capture-tab-merge-design.md)

## 问题定位

用户附两张截图对比：「系统设置 → 轨迹抓取配置」（追踪网络/轨迹改造/轨迹关键词/抓取时间/操作轨迹 5 个子 tab）页面割裂 —— 子 tab 被单独包在一张 `NCard`（content padding 8px + `mb-16px`）里，与下方表格区之间露出 16px 灰色页面背景；而「系统设置 → 初始化数据」（渠道类别等）页 tab 与表格同处一张卡片、连成一体。

澄清过程：先后两轮确认排除了「工具栏按钮 / 勾选列 / 行内删除」方向（用户："跟工具栏没关系"），最终确认诉求 = **把 tab 栏和表格融合在一起**（同一卡片、tab 下仅一条分隔线、无灰色间隙），5 个子页全部生效。

## 方案（已确认）

`TraceCapture.vue` 单文件重构为「单卡片 + 全高 NTabs」，对齐初始化数据页已验证的结构：

- 去掉独立 tab 卡片（`NCard` + `mb-16px`）以及「`NTabPane` 空占位 + 外层按 `active` 用 `v-if` 渲染表格」的结构；
- 改为 `NCard`（h-full，content padding 0，flex column，minHeight 0）→ 内容容器（`flex-1 min-h-0 overflow-hidden px-16px py-16px`）→ `NTabs`（line）→ 各 `NTabPane` 内直接渲染表格/操作轨迹表；
- 全高布局 CSS 三件套照搬 `InitData.vue`：`.trace-capture-tabs`（flex column / height 100%）、`.n-tabs-pane-wrapper`（flex:1 1 auto / min-height 0）、`.n-tab-pane`（height 100%），保证表格撑满并在卡片内滚动；
- 前 4 个子页拆为 `configTabs` 数组（key 类型即 `Api.SystemManage.TraceCaptureCategory`）+ 操作轨迹独立 pane，避免模板中写 `t.key as Api.X` 断言 —— eslint `vue/no-undef-properties` 对模板里出现的 `Api.` 会误报未定义（已知坑）；
- naive `NTabs` 默认 `display-directive="if"`，仅渲染当前 pane，切换时重建组件重新取数，行为与改动前的 `v-if` 一致。

## 改动文件

- `src/views/system-manage/setting/modules/trace-capture/TraceCapture.vue`（唯一改动文件）

不改动：`TraceConfigTable.vue` / `OperationTraceTable.vue`、service / mock / i18n；设置页最外层 6 个 segment tab 与其下方内容的间隙保持现状（与初始化数据页一致）。

## 验证

- `pnpm typecheck` 0 错误；单文件 oxfmt / oxlint / eslint 0 问题；
- `pnpm build` → Build successful；
- 无浏览器端到端（本地无后端会话），最终视觉效果由用户查看确认。
