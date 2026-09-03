# MEMORY

## 语言偏好（最高优先级）

- 用户明确要求：**所有内容一律中文**，包括设计文档、讨论记录、代码注释。
- 这**覆盖** AGENTS.md 里「代码注释用英文 JSDoc」的约定。本项目实际以中文为准，不要写英文注释 / 英文文档。
- 例外：第三方库 API、变量名、技术专有名词可保留英文；但解释性注释、commit 说明、文档正文都用中文。

## 状态字段 EnableStatus 约定（number 0/1）

- **`Api.Common.EnableStatus = 0 | 1`**（number 类型，不是字符串）：`1` = 启用，`0` = 禁用。原 `'1'`/`'2'` 字符串惯例已于 2026-09-03 全局改为 `0/1`（用户明确要求"禁用为0启用为1"且是 number 类型）。
- 涉及：类型定义 `src/typings/api/common.d.ts`、所有 mock（`mock.ts`/`mock-data-manage.ts` 及 12 个 MasterData 档案页 `createDefault`）、状态下拉选项（role/index、menu-operate-drawer、`MasterData/shared.ts` 的 `useArchiveStatusOptions`：enable=`1`、disable=`0`）、状态列渲染 `Table/table.vue` 的 `type:'status'` 默认 `activeValue ?? 1`、以及各状态开关（NSwitch）都需配 `checkedValue:1`/`uncheckedValue:0`（通过 `FormItemConfig.checkedValue/uncheckedValue` 透传）。
- **坑**：NSwitch 默认 `checked-value=true`，若绑数字 `1` 不配 `checkedValue` 会显示成"禁用"；`type:'status'` 列默认 `activeValue ?? '1'`（字符串）也会因 `1 === '1'` 为 false 全部显示禁用——两处都已改成默认 `1`。
- 表单开关映射字段：`src/components/Form/form-config.ts` 的 `FormItemConfig` 已加 `checkedValue?: string|number|boolean` / `uncheckedValue?: ...`，`Form/index.vue` 的 NSwitch 绑定二者。

## vxe-table v4 tree 模式（项目踩坑）

`tree-config` 必须显式带 **`rowField`**，否则 vxe-table 不进入 tree 模式，只渲染顶层数组、忽略 `children` 嵌套（菜单管理页曾因此树形子级不显示）。

光有 `rowField` 也只解决"能不能遍历到嵌套节点"。**真正决定渲染缩进 + ▷ 箭头的是列自身的 `treeNode` 属性**（vxe-column 上是 `tree-node` prop；ColumnInfo 直接读 `colConfs.treeNode`，整个 vxe-table 源码里没有任何"自动选树节点列"或"按 field 反查"的代码——所以 `tree-config.treeNodeColumn` / `tree-config` 上任何"指定列"的字段在本版本（v4.5.9）都不生效，纯属臆造）。要在哪一列渲染树 UI，就在那一列配置上写 `treeNode: true`。

两种写法在本项目都可用（都需要对应列配 `treeNode: true`）：

1. **parentId 模式** —— 数据扁平 + `parentId`：

   ```ts
   treeConfig: { rowField: 'id', parentField: 'parentId', transform: true, expandAll: true }
   ```

   vxe-table 用 `XEUtils.toArrayTree` 自动组树。前提：数据的 `parentField` 值能在 `rowField` 里找到，根节点用 0 / null 等不存在的值。

2. **children 模式** —— 数据已是嵌套树：
   ```ts
   treeConfig: { rowField: 'id', childrenField: 'children', expandAll: true }
   ```
   自己用 `parentId` 在前端把扁平数据组好（项目里有 `buildMenuTree` 工具函数），再交给 vxe-table 渲染。

项目封装 `src/components/Table/table.vue`：已把 `:tree-node="col.treeNode"` 透传给 `<vxe-column>`；`src/components/Table/use-vxe-table.ts` 的 `VxeColumnConfig` / `VxeColumnRenderColumn` 都已带 `treeNode?: boolean` 字段（持久化也覆盖）。业务侧只需在列配置写 `treeNode: true` 即可启用该列的树节点列渲染。

⚠️ **树节点列不可被用户隐藏**：列设置弹窗（`table-column-config.vue`）对 `treeNode` 列禁用了"显示"开关（防用户关掉后整棵树退化成平铺）；同时 `useVxeTable` 的 `columns` computed 用 `.filter(col => col.visible || col.treeNode)` 兜底，即使 localStorage 缓存里 `visible:false` 也强制保留树节点列。新增树表时务必给树节点列加 `treeNode:true`，且不要动这两条保护。

新增 i18n 键务必「zh-cn / en-us / `src/typings/app.d.ts` 的 `App.I18n.Schema`」三处同步，否则 `pnpm typecheck` 报 `I18nKey` 错误（`$t` 的键是静态类型推导的）。

未来如果升级 vxe-table 并发现 `tree-config.treeNodeColumn` 真的生效了，可以再加回该字段做兼容；当前版本不要写。

## 菜单管理页数据约定

- DEV mock（`src/service/api/mock.ts` 的 `mockMenuList`）返回**扁平**数组，每行带 `parentId`、无 `children`。
- 生产 `/system/menu/list` 返回的是带 `children` 的嵌套树、无 `parentId` 字段（按用户实测确认）。

## archive-switch / 动态档案切换的布局陷阱

- 内容区**不要**多套 `<div class='absolute inset-0'>` 包裹 `<Transition>` + `<KeepAlive>` + `defineAsyncComponent`：会让切到非首屏档案（首次加载的 async 组件）时真实组件挂载异常、内容只剩微小 spinner、搜索栏/表格全不可见；仓库（默认首项）能加载，切走再切回也触发同一问题。
- 正确结构（src/components/MasterData/archive-switch.vue）：外层 `<div class='flex h-full w-full overflow-hidden'>`（根也要 overflow-hidden 配合 fade-slide 动画），右侧 `<div class='relative min-w-0 flex-1 overflow-hidden'>` 直接放 `<Transition :name mode='out-in'><KeepAlive><component :is='asyncComps[activeKey]' :key='activeKey' class='h-full w-full' /></KeepAlive></Transition>`，不要再包 absolute 层。
- fade-slide / zoom-fade 等带 translate/scale 的页面切换动画会让 component 溢出容器 → **右侧容器与根都必须 `overflow-hidden`**，否则动画期间触发页面级横向/竖向滚动条。

## 表格 loading 显示约定（全项目通用 Table）

- **统一用 vxe-table 自带的 `:loading`**（原生遮罩自带平滑淡入淡出、与表格高度/滚动条协同更好）。不要另包 `<NSpin :show>` 或自定义 fade 遮罩层（naive-ui NSpin 的 show 是硬显隐、无平滑过渡，且 loading 时表格高度易跳动）。
- 落地（src/components/Table/table.vue）：`vxe-table` 加 `:loading="loading"` 即可；`loading` 由 `useVxeTable` 的 `startLoading/endLoading` 控制（mock 异步化让 loading 真实可见）。`NSpin` 在 Table 内不使用（全局注册，删 usage 即可）。

## 表格列宽/行为约定（全项目通用 Table）

- 默认开启**列宽拖拽**：`vxe-table` 上加 `:column-config="{ resizable: true }"`（vxe-table 默认 `resizable:false`，需显式开启）。所有档案页表格均可拖拽列右边界调整列宽。
- 个别列不想可拖：在该 `vxe-column` 上单独设 `:resizable="false"` 覆盖。
- 列内容溢出统一**单行省略+tooltip**：`vxe-table` 上加 `:show-overflow="'tooltip'"`（vxe-table 等价于 show-over-tooltip，鼠标悬停显示完整内容）。个别列需换行展示：在该 `vxe-column` 上单独设 `:show-overflow="false"` 覆盖。
- 当前菜单页采用 children 模式：扁平数据 → `buildMenuTree(data.value)` 组树 → 表格和抽屉共用 `menuTree`。`buildMenuTree` 是从 `parentId` 推导的，符合"用 parentId 渲染"。

## pnpm release 流程踩坑（已修复）

- `pnpm release` = `sa release` → `packages/scripts/src/commands/release.ts`（bumpp）。**交互式**：真实终端跑，会弹版本选择菜单（选 `next`/`patch` 回车）；非交互 shell 会卡住。
- 链路：bumpp 改版本 → 跑 `execute`（`pnpm sa changelog` 重生成 `CHANGELOG.md`）→ `git commit -A` 触发 `pre-commit` 钩子（`pnpm typecheck && pnpm lint && pnpm fmt && git diff --exit-code`）。
- **历史坑 1（2026-09-01）**：空仓库无 tag 时 `git describe` 报 `No names found`，changelog 卡死。已建本地基准 tag `v0.0.0` 解决。
- **历史坑 2（2026-09-03，已修复）**：`@soybeanjs/changelog` 生成的 `CHANGELOG.md` 贡献者段有空行，`oxfmt` 会删它；`pre-commit` 的 `git diff --exit-code` 因此检测到未暂存改动 → `git commit` 退出 1。修复：把 bumpp 的 `execute` 改为函数，先跑 `pnpm sa changelog` 再补一句 `pnpm fmt`，让 changelog 在 bumpp 暂存前就 fmt 干净，钩子里的 fmt 变空操作。
- bumpp `execute` 字符串若含 `&&` 会被 `tokenizeArgs` 误拆，必须用函数式 `execute` 分两次 `execCommand`。
- `sa` 由 `tsx` 直跑 `packages/scripts/src`（bin.ts `#!/usr/bin/env tsx`），改 scripts 即时生效，无需构建。
- 该命令最后会 push 到远程（含 tag），运行前确保 `git status` 干净且确实要推送。

## 通用表格搜索栏（独立 SearchBar 组件 + Table 配置委托）

- 搜索栏是**独立、可复用**的组件 `src/components/SearchBar/search-bar.vue`（2026-09-03 落地；spec: `docs/superpowers/specs/2026-09-03-search-bar-table-design.md`），**不依赖 MasterData、任何表格/页面都能直接用**。
- `SearchBar` props：`items: FormItemConfig[]`、`model: Record<string,unknown>`、`collapsed?: boolean`（默认 `true` 收起）、`gridXGap`/`gridResponsive`/`labelPlacement`/`labelWidth`；emits：`search` / `reset`。内部 `NCard + NFormWrap`（`#actions` 槽位内置「搜索/重置」按钮）；折叠用 **`opacity` + `transform: translateY(-8px)`**（`Transition` + `v-show` 切 `display`，0.2s）。**关键：绝不动画布局属性**——`height` 与 `grid-template-rows: 0fr↔1fr` 都逐帧触发整张 `NFormWrap` 重排、字段多必卡；只有 `opacity`/`transform` 走 GPU。收起 `display:none`（空间回收；状态保留因为 model 在父页面）。复用 `common.search`/`common.reset`，不新增 i18n。
- 通用 `Table`（`src/components/Table/table.vue`）把搜索栏做成**可选「表格配置」**：新增 props `searchItems` / `searchModel` / `searchDefaultCollapsed`（默认 `true` 收起）+ emits `search`/`reset`；操作栏最右渲染搜索图标按钮（`icon-ic-round-search`，展开态高亮 `primary`），**内部委托渲染独立 `<SearchBar>`**，不再内联 NFormWrap。即：所有用通用 Table 的页面，只要在 `<Table>` 上配 `:search-items`/`:search-model` 并监听 `@search`/`@reset` 即可获得搜索栏；同时 `SearchBar` 也能被不基于通用 Table 的页面直接复用。
- 用法（master-data-archive / role）：`<Table ... :search-items="..." :search-model="searchParams" @search="handleSearch" @reset="handleReset" />`；搜索栏显隐由 Table 内置的图标按钮控制。
- 折叠状态不持久化（默认收起）。
- 每个界面的搜索项必须各自配置：12 个档案页各自声明独立的 `searchItems`（基线 keyword + status + actions），`shared.ts` 仅保留真正共用的 `useArchiveStatusOptions()`；`searchItems` 末项保留 `{ key:'actions', slot:'actions' }` 以驱动 NFormWrap 的按钮区。禁止把搜索项抽成跨界面共享函数。

## 系统设置页内 Tab 切换（无独立子路由 URL）

- 「系统设置」(`system-manage_setting`) 是单一菜单项，点进去**顶部全局 tab 显示「系统设置」**，页面内 `NTabs` 再用本地 `activeKey` 切换 7 个子模块（录单格式/打印格式/导出格式/运单规则/通知配置/初始化数据/站点扫描）。
- 实现：`setting/index.vue` 用 `import` 直接加载 7 个子组件，经 `componentMap` 由 `<keep-alive><component :is="componentMap[activeKey]"></keep-alive>` 渲染；切换只改 `activeKey`，**不 `router.push` 子路由**。
- **7 个子模块是纯组件，放在 `setting/modules/`**（如 `InputFormat.vue`），**不是路由**：elegant-router 默认忽略 `views/**/modules/` 与 `components/` 目录，因此不会生成 `system-manage_setting_*` 子路由，也不会给父路由加自动 `redirect`。子模块**无独立 URL**，刷新回到默认 `input-format`。
- ⚠️ **历史坑（2026-09-03，已修复）**：最初子页放在 `setting/<name>/index.vue`，被 elegant-router 自动生成为 `system-manage_setting` 的子路由，父路由因此被自动加 `redirect` 到第一个子路由；当时 `guard/route.ts` 又有「`system-manage_setting_*` 一律 replace 回父路由」规则 → 父子互指**重定向死循环、页面卡死**。修复 = 把子页移出自动路由目录到 `modules/`，并删除守卫那条已失效规则。
- 衍生经验：① elegant-router 的 `transform.ts` 会给任何有 `children` 的路由自动加 `redirect` 指向首子路由——设计"父页面 + 子组件"结构时务必别让子组件落在自动路由目录；② `sa gen-route` 是**交互式新建路由脚手架，不是全量重生成**；全量重生成靠 `pnpm dev`/`build` 的 vite 插件（本机 WebStorm `coding-copilot` 的 `node-safe-delete-shim` 会拦截 vite 的 `rm` 导致 dev 启动失败，但配置阶段已写好生成的路由文件）。
