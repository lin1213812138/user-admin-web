# MEMORY

## 语言偏好（最高优先级）

- 用户明确要求：**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明）。
- 这**覆盖** AGENTS.md 里「代码注释用英文 JSDoc」的约定。第三方库 API / 变量名 / 技术名词可保留英文。

## 状态字段约定（Api.Common.EnableStatus = 0 | 1，number）

- `1` = 启用，`0` = 禁用。2026-09-03 由原 `'1'/'2'` 字符串全局改为 number `0/1`。
- 涉及：类型 `src/typings/api/common.d.ts`、所有 mock、状态下拉选项（role / menu-operate-drawer / `MasterData/shared.ts` 的 `useArchiveStatusOptions`）、`Table/table.vue` 的 `type:'status'` 列、各 NSwitch。
- **坑**：NSwitch 默认 `checked-value=true`，绑数字 `1` 必须配 `checkedValue:1`/`uncheckedValue:0`；`type:'status'` 列的 `activeValue` 默认也要是 number `1`（字符串 `'1'` 会导致 `1==='1'` 为 false，全部显示禁用）。
- `FormItemConfig` 已支持 `checkedValue` / `uncheckedValue`，`Form/index.vue` 的 NSwitch 绑定二者。

## 通用 Table 约定（src/components/Table）

- **loading**：统一用 vxe-table 原生 `:loading`，不要包 `<NSpin :show>`（硬显隐、无过渡、高度易跳）。
- **列宽**：`vxe-table` 上加 `:column-config="{ resizable: true }"`（默认 false）；个别列 `:resizable="false"` 覆盖。
- **溢出**：`:show-overflow="'tooltip'"` 单行省略+悬停全文；个别列 `:show-overflow="false"` 换行。
- **搜索栏**：独立组件 `src/components/SearchBar/search-bar.vue`，Table 通过 props `searchItems`/`searchModel`/`searchDefaultCollapsed`（默认收起）+ emits `search`/`reset` 委托渲染，操作栏最右搜索图标按钮控制显隐。
  - 折叠动画**只动 `opacity` + `translateY`**（0.2s），绝不动画 `height` / `grid-template-rows: 0fr`（逐帧重排整张表单，字段多必卡）。收起用 `display:none`，状态保留在父页面 model。
  - 每个界面各自声明 `searchItems`（末项 `{ key:'actions', slot:'actions' }`），禁止抽成跨界面共享函数。

## vxe-table v4 树表（v4.5.9 踩坑）

- `tree-config` 必须显式带 **`rowField`**，否则不进树模式。
- **决定缩进+箭头的是列自身的 `treeNode: true`**（vxe-column 的 `tree-node` prop）。`tree-config.treeNodeColumn` 等"指定列"字段本版本**不生效**，别写。
- 两种模式：parentId 扁平 + `{ rowField, parentField, transform:true }`；或前端先组树（`buildMenuTree`）+ `{ rowField, childrenField }`。
- **树节点列不可被用户隐藏**：列设置弹窗禁用其"显示"开关；`useVxeTable` 的 columns computed 以 `col.visible || col.treeNode` 兜底。新增树表务必给树节点列加 `treeNode:true`，别动这两条保护。
- 菜单管理页：DEV mock 返回**扁平 + parentId**；生产 `/system/menu/list` 返回**嵌套 children、无 parentId**。

## 系统设置页 Tab（无独立子路由）

- `system-manage_setting` 单一菜单，页面内 `NTabs` + 本地 `activeKey` 切 7 个子模块，子组件放 `setting/modules/*.vue`（**不是路由**，elegant-router 忽略 `modules/`），刷新回默认。
- ⚠️ 历史坑：子页曾放 `setting/<name>/index.vue` 被自动生成子路由 + 父路由自动 redirect，叠加守卫的 replace 回父路由 → **重定向死循环卡死**。
- 衍生：`transform.ts` 会给任何有 children 的路由自动加 redirect 指向首子路由；`sa gen-route` 是交互式脚手架，**全量重生成**靠 `pnpm dev/build` 的 vite 插件。

## 系统设置页 MasterDetail 右侧「占满剩余高度」机制

- **右侧内容是每个界面独有的，不是共用组件**（用户 2026-09-04 明确）：不要在 `MasterDetail` 里按「统一行为」改，壳体只负责让 slot 有可用高度，「谁占满」由各页面自己的卡片决定。
- 壳（`components/MasterDetail.vue`）右侧：`NScrollbar content-class="min-h-full flex-col"` + 内部 slot 容器 `flex-1 flex-col`。用 **`min-height:100%` 而不是 `height:100%`**（后者内容超出会截断、外层滚动失效）。无需 prop/分支，没有 `flex-1` 子元素的页面视觉零变化。
- 卡片侧：`components/FieldMapping.vue` 有可选 `fill` prop → NCard 加 `flex-1 min-h-0 flex-col`，`content-style` 改 `{ display:flex; flex-direction:column; min-height:0; flex:1 }`，内容区包 `NScrollbar` 内部滚动。**只有 `InputFormat.vue`（录单格式）传 `fill`**，其它 5 页保持自然高度。
- 业务事实：**字段映射只在录单格式存在**，其它 5 个页面的 FieldMapping 是模板复制的占位数据（本轮未清理）。
- 既有坑：`modules/PrintFormat.vue` 有 6 个 `@typescript-eslint/no-unused-vars` 误报（变量在模板中确有使用，同结构的 StationScan.vue 不报错）→ 全库 `pnpm lint` / pre-commit 会失败，未处理。

## 其它零散约定

- **改通用组件前先确认实际链路**：用户截图 → 页面 → 子组件。设置页左侧列表（录单格式等）是 `setting/components/MasterDetail.vue`，**不是**通用 Table；其状态徽标已改为实心彩色 NTag（暗黑模式文字换 `#1f1f1f`）。
- **i18n 新增键三处同步**：`locales/langs/zh-cn.ts`、`en-us.ts`、`typings/app.d.ts` 的 `App.I18n.Schema`，否则 `pnpm typecheck` 报 `I18nKey`。
- `pnpm release`（bumpp，交互式）：已修复两坑——空仓库 `git describe` 需基准 tag `v0.0.0`；CHANGELOG 空行被 oxfmt 删导致 `git diff --exit-code` 失败，改为 bumpp 的**函数式 execute**（含 `&&` 的字符串会被误拆）里先 `pnpm sa changelog` 再 `pnpm fmt`。最后会 push 远程含 tag。
- archive-switch 布局：内容区**不要**多套 `<div class='absolute inset-0'>` 包 Transition+KeepAlive+defineAsyncComponent（切档案会只剩微小 spinner）；根与右侧容器都要 `overflow-hidden` 防切换动画溢出滚动条。
- 本机 WebStorm `coding-copilot` 的 `node-safe-delete-shim` 会拦截 vite 的 `rm` 导致 dev 启动失败。
