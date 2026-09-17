# 左侧竖向 Tab 公共组件（VerticalTabLayout）

> 日期：2026-09-17
> 触发语：「能不能封装一个公共组件左侧竖向tab右侧表格」→（中途修正）「等下不需要插槽右侧只能是表格」→（最终）「右侧可以是这样的也可以直接使用表格，应该直接用插槽」

## 1. 背景与需求演进

系统设置页（`setting/index.vue`）自 2026-09-16 改为「左侧竖向 tab + 右侧内容区」后，用户希望把这种形态沉淀为公共组件复用，并给 tab 栏上方加「当前页面名称」标题（截图示范，蓝竖条 + 加粗文字）。

需求在讨论中经历三次修正：

1. 初始诉求「左侧竖向 tab + 右侧表格」的公共组件（候选定位 A 抽 setting 壳 / B 左分类+右表格一体化 / C 纯 tab 栏 UI）。
2. 一度要求右侧**只能**是表格、不要插槽（此时 setting 页因右侧内容多样无法接入）。
3. 最终澄清：右侧「可以是动态组件（setting 页的 KeepAlive + componentMap）也可以是表格」，**直接开默认插槽**，由调用方决定内容 —— 组件只负责「左侧竖向 tab 栏（含页面名标题）+ 右侧内容区」。

## 2. 最终方案

### 2.1 组件 `src/components/VerticalTabLayout/index.vue`（+ 同目录 `README.md` 使用文档）

| 项       | 说明                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Props    | `value`（v-model:value，当前 tab）/ `tabs: { value: string \| number; label: string }[]` / `title?`（左栏顶部页面名称，不传则不渲染标题区）                                                                                   |
| Emits    | `update:value`                                                                                                                                                                                                                |
| 结构     | 左：标题区（`h-16px w-3px rounded-2px bg-primary` 竖条 + `text-15px font-600`，复用 Form 的 section 标题样式）+ 贴边竖向 `NTabs placement="left" type="line"`；右：默认插槽 + `min-w-0 min-h-0 flex-1 overflow-hidden p-16px` |
| 左栏外观 | 沿用 setting 页既定样式：`border-r border-#e5e7eb bg-container px-0 py-8px dark:border-#2a2a2a`，`w-fit` 自适应宽度                                                                                                           |
| 关键点   | 左栏 tab 外层包裹 div 必须保留（`.n-tabs` 自带 `width:100%`，直接当 flex item 会占满整行）；tab 列表 `min-h-0 flex-1 overflow-y-auto`（分类多时内部滚动）                                                                     |

组件通过**显式 import** 使用（不依赖 `components.d.ts` 自动注册声明，保证 `pnpm typecheck` 通过；`components/common` 下仍会自动注册备用）。

### 2.2 接入点

1. **`setting/index.vue`**：整页替换为 `<VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.system-manage_setting')">` + 插槽内原 `KeepAlive`/`componentMap` 动态组件；`tabs` 由 `{ key, label }` 改为 `{ value, label }`；`handleTabChange` 删除（v-model 处理）；`?tab=` query 同步逻辑保留。
2. **`export-format/ExportFormat.vue`**：由 `MasterDetail`（左侧 240px 卡片列表）改为 `VerticalTabLayout`（左侧 13 个分类竖向 tab + 标题「导出格式」）；`categoryTabs` 由 `categories` 派生（数值 id → `String(id)`）；`activeKey` 为 string，api 闭包内 `Number(activeKey.value)`；新增 `watch(activeKey)` 切分类时回到第一页并重新取数；右侧插槽保持原「hint 小字 + Table + Drawer」。
   - **顺手修复**：原实现未处理 Table 的 `pageChange` 事件（分页点击不生效），本次补 `@page-change="handlePageChange"`（与站点/日志等页面范式一致）。

## 3. 实施结果

- 新增：组件**独立文件夹** `src/components/VerticalTabLayout/`——`index.vue`（组件本体，对齐 `Table/`、`Form/` 的组织范式）+ `README.md`（使用方法文档：文件位置/引入方式/Props/事件/插槽/表格与动态组件两类示例/6 条注意事项/已接入页面）。
- 修改：`setting/index.vue`（左栏/标题/右侧插槽换组件）、`export-format/ExportFormat.vue`（换组件 + 分页修复）；`src/typings/components.d.ts` 中 `VerticalTabLayout` 自动注册声明路径随目录迁移由 dev watcher 自动更新（自动生成文件，未手改）。
- 未动：`MasterDetail.vue`（print-format、init-data 仍在用）、其他设置子模块、路由、elegant 生成文件。

## 4. 验证

- `pnpm typecheck` exit 0。
- `pnpm lint` oxlint 0 error + eslint 0 error（`link.vue` 2 条既有 warning 与本轮无关）。
- 浏览器效果（设置页左侧标题「系统设置」、export-format 左分类 tab 形态、表格分页）待用户复核。

## 5. 遗留

- 组件暂未内置「切 tab 自动刷新数据」逻辑（右侧是插槽，组件不知道内容语义），需要取数的页面自行 `watch(activeKey)` 重置分页 + `getData()`（export-format 已示范）。
- `print-format` 等其他「左分类 + 右表格」页面尚未迁移到新组件，后续按需接入。
