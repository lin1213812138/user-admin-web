# MEMORY

## 语言偏好（最高优先级）

- 用户明确要求：**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明）。
- 这**覆盖** AGENTS.md 里「代码注释用英文 JSDoc」的约定。第三方库 API / 变量名 / 技术名词可保留英文。

## 状态字段约定（Api.Common.EnableStatus = 0 | 1，number）

- `1` = 启用，`0` = 禁用。2026-09-03 由原 `'1'/'2'` 字符串全局改为 number `0/1`。
- 涉及：类型 `src/typings/api/common.d.ts`、所有 mock、状态下拉选项（role / menu-operate-drawer / `MasterData/shared.ts` 的 `useArchiveStatusOptions`）、`Table/table.vue` 的 `type:'status'` 列、各 NSwitch。
- **坑**：NSwitch 默认 `checked-value=true`，绑数字 `1` 必须配 `checkedValue:1`/`uncheckedValue:0`；`type:'status'` 列的 `activeValue` 默认也要是 number `1`（字符串 `'1'` 会导致 `1==='1'` 为 false，全部显示禁用）。
- `FormItemConfig` 已支持 `checkedValue` / `uncheckedValue`，`Form/index.vue` 的 NSwitch 绑定二者。
- `FormWrap` 的 `mergedRules` 自动必填规则已通用改为 `required:true` + 自定义 `validator` 判空（仅 `null/undefined/''` 视为空），数字 `0`/`1` 不再误判。不要再为数字字段补 `type:'number'` 来规避（旧补丁已移除，2026-09-04）。

## 通用 Table 约定（src/components/Table）

- **loading**：统一用 vxe-table 原生 `:loading`，不要包 `<NSpin :show>`（硬显隐、无过渡、高度易跳）。
- **列宽**：`vxe-table` 上加 `:column-config="{ resizable: true }"`（默认 false）；个别列 `:resizable="false"` 覆盖。
- **溢出**：`:show-overflow="'tooltip'"` 单行省略+悬停全文；个别列 `:show-overflow="false"` 换行。
- **搜索栏**：独立组件 `src/components/SearchBar/search-bar.vue`，Table 通过 props `searchItems`/`searchModel`/`searchDefaultCollapsed`（默认收起）+ emits `search`/`reset` 委托渲染，操作栏最右搜索图标按钮控制显隐。
  - 折叠动画**只动 `opacity` + `translateY`**（0.2s），绝不动画 `height` / `grid-template-rows: 0fr`（逐帧重排整张表单，字段多必卡）。收起用 `display:none`，状态保留在父页面 model。
  - 每个界面各自声明 `searchItems`（末项 `{ key:'actions', slot:'actions' }`），禁止抽成跨界面共享函数。

## 表格导出体系（v3，2026-09-05 定稿）

- 两套并存、按页面需要开：**右上 `Table action-export` = vxe-table 原生高级导出弹窗**（`<vxe-table>` 挂 ref 调 `openExport({ type:'xlsx', filename, sheetName })`，弹出「导出数据」面板，可选择文件名/类型/字段/表头）；**exceljs 字段选择导出 = `TableExportAction`**，由页面自行放进**左侧操作栏**（`operation-left`），字段勾选/含隐藏列/fetchAll 全量/status 文案都由它负责。
- 引擎：exceljs 动态 import 的 `export-xlsx.ts`（唯一出口）；`@vxe-ui/plugin-export-xlsx` 全局注册于 `src/plugins/vxe-table.ts`，只支撑原生 exportData。`exportRowsToXlsx` 与 `createDefaultExportName` 从 `@/components/Export` 导出。
- vxe-table 实例的 `exportData` 在核心 d.ts 里**没有**类型声明（方法由插件运行时挂载）→ table.vue 用本地最小接口 `VxeExportableTable` 收敛，勿依赖官方类型。
- ⚠️ `src/typings/components.d.ts` 由 vite 插件生成（禁手改）；本机因 WebStorm shim 拦 vite 缓存 rm 跑不起 dev 去重生成。**已登记进 components.d.ts 的组件文件不能直接删除**，否则残留引用致 typecheck 失败——保留 alias 文件（非 setup script `export default` 指向主体）即可，待下次 dev/build 正常后再清理。示例：`Export/field-export.vue` 是 `table-export-action.vue` 的 alias，勿删。
- 用户管理页是两套并存的示例页。

## 导出「数据范围」选项（2026-09-05 加在 exceljs 管线 B 上）

- `TableExportAction`（左操作栏）的字段弹窗**顶部操作行**（与「新增字段」按钮同排，位于其左侧）有「数据范围」单选项：**全部数据 / 当前页（N 条）/ 勾选数据（N 条）**，分别取 `fetchAll()` / `data` / `checkedData`。弹窗高度维持 520px（合并后不额外占行）。
- 类型在 `Export/type.ts`：`ExportScope = 'all'|'page'|'checked'`、`ExportScopeOption{value,label,disabled,hint}`、`ExportConfirmPayload{scope: ExportScope|null, fields}`。
- `FieldSelectDialog` 的**范围区是可选能力**：不传 `scopes` 就不渲染（`DataExport` 非表格页因此零变化）。`confirm` 事件签名是 `(payload: ExportConfirmPayload)`，不是裸 `ExportField[]`。
- 规则：默认 `有 fetchAll → 全部，否则 → 当前页`；**每次打开弹窗重置，不记忆**；不可用项**灰显禁用**（不隐藏），hint 挂 `title`。
- 页面接入只需多传一个 `:checked-data="checkedRows"`（页面 `@selection-change` 已持有），无需改 `useVxeTable`。

## build 被 WebStorm shim 拦截的确定性解法

- `pnpm build` 报 `plugin vite:prepare-out-dir` / `emptyDir` / `--file parameter is required` 时，**编译其实已成功**（日志会先打印 Build successful），只是清空 dist 被 `node-safe-delete-shim` 拦。
- 解法：先手动删产物目录再 build —— PowerShell `Remove-Item -Recurse -Force dist`（不受 node 层 shim 影响）。**不要当成代码问题去查**。

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
- 壳（`components/MasterDetail.vue`）右侧：**2026-09-04 终版已移除外层 `NScrollbar`**（它 `content-class="min-h-full flex-col"` 会让内容包裹层随内容撑高，导致子卡片永远不比内容矮、内部滚动失效、整块溢出）。改为固定高度内容容器 `<div class="min-w-0 flex-1 flex-col min-h-0 overflow-hidden px-16px py-16px">` + 顶部操作栏 `shrink-0`。**整体不滚动**，高度不足时卡片 `flex:1` 吃剩余空间，内容超高由各页内容自己内部滚动。
- 卡片侧：`components/FieldMapping.vue` 有可选 `fill` prop → NCard 加 `flex flex-1 min-h-0 flex-col`，`content-style` = `{ display:flex; flex-direction:column; min-height:0; flex:1; padding:0 }`（`flex:1`=basis 0 干净占满，勿用 `1 1 auto` 否则被内容撑开溢出），`v-if="fill"` 时内容包 `<NScrollbar class="min-h-0 flex-1" content-class="min-h-full">` **内部滚动**。非 fill 分支保持自然高度 div。
- **关键坑（2026-09-04 反复踩）**：`MasterDetail` 外层若用 `NScrollbar` + `min-h-full`，其 content wrapper 会随内容长高，子卡片 `flex-1` 跟着长高 → 卡片不比内容矮 → 内部 NScrollbar 永不触发、整页溢出。所以「整体不滚 + 子卡片内滚」必须去掉外层 NScrollbar，用固定高度 `overflow-hidden` 容器。`flex-1` 是 `1 1 0%`（basis 0），`flex-auto` 是 `1 1 auto`（basis 取内容）会撑高，别混用。
- 业务事实：**字段映射只在录单格式存在**，其它 5 个页面的 FieldMapping 是模板复制的占位数据（本轮未清理）。
- 既有坑：`modules/PrintFormat.vue` 有 6 个 `@typescript-eslint/no-unused-vars` 误报（变量在模板中确有使用，同结构的 StationScan.vue 不报错）→ 全库 `pnpm lint` / pre-commit 会失败，未处理。

## 按钮权限（前端静态配置，2026-09-05）

- 角色分配权限抽屉（`role/modules/role-permission-drawer.vue`）每行菜单后渲染「操作权限」列（按钮 `NCheckboxGroup`），让角色勾选到按钮粒度。
- 按钮清单集中在 `src/constants/button-permissions.ts`：导出 `ButtonPermission{code,label}`、`getMenuButtons({permission, routePath})`。以菜单 **`permission` 或 `routePath`** 为 key 匹配（命中即返回），需与后端 `/system/menu/list` 返回字段一致。
- 按钮 `code` 约定 `system:{模块}:{操作}`（如 `system:user:add`）；角色专属码（`system:role:assign`/`system:user:resetPwd` 等）在配置里直接写。
- 勾选状态按菜单 id 存 `rowButtonChecks: Record<number, string[]>`，独立于搜索过滤（防丢）。提交随 `menuIds` 携带 `buttonCodes`（`RoleAssignMenuParams` 已加 `buttonCodes?`）。
- **后端依赖（尚未实现）**：① `/system/role/assignMenu` 需支持接收并落库 `buttonCodes`；② 角色已分配按钮的**回显**需 `role/menuTree` 返回 `checkedButtonCodes`（目前回显为空，需用户重新勾）。

## 其它零散约定

- **改通用组件前先确认实际链路**：用户截图 → 页面 → 子组件。设置页左侧列表（录单格式等）是 `setting/components/MasterDetail.vue`，**不是**通用 Table；其状态徽标已改为实心彩色 NTag（暗黑模式文字换 `#1f1f1f`）。
- **i18n 新增键三处同步**：`locales/langs/zh-cn.ts`、`en-us.ts`、`typings/app.d.ts` 的 `App.I18n.Schema`，否则 `pnpm typecheck` 报 `I18nKey`。
- `pnpm release`（bumpp，交互式）：已修复两坑——空仓库 `git describe` 需基准 tag `v0.0.0`；CHANGELOG 空行被 oxfmt 删导致 `git diff --exit-code` 失败，改为 bumpp 的**函数式 execute**（含 `&&` 的字符串会被误拆）里先 `pnpm sa changelog` 再 `pnpm fmt`。最后会 push 远程含 tag。
- archive-switch 布局：内容区**不要**多套 `<div class='absolute inset-0'>` 包 Transition+KeepAlive+defineAsyncComponent（切档案会只剩微小 spinner）；根与右侧容器都要 `overflow-hidden` 防切换动画溢出滚动条。
- 本机 WebStorm `coding-copilot` 的 `node-safe-delete-shim` 会拦截 vite 的 `rm` 导致 dev 启动失败。
