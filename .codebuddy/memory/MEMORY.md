# MEMORY

## 语言偏好（最高优先级）

- 用户要求**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」。库 API / 变量名 / 技术名词保留英文。

## 状态字段（Api.Common.EnableStatus = 0 | 1，number）

- `1` 启用 / `0` 禁用（2026-09-03 由 `'1'/'2'` 字符串全局改 number）。涉及 `typings/api/common.d.ts`、所有 mock、状态下拉（role / menu-operate-drawer / `MasterData/shared.ts` 的 `useArchiveStatusOptions`）、`Table/table.vue` 的 `status` 列、各 NSwitch。
- 坑：NSwitch 默认 `checked-value=true`，绑 1 必须配 `checkedValue:1`/`uncheckedValue:0`；`status` 列 `activeValue` 默认必须是 number `1`（`'1'` 会让 `1==='1'` 为 false，全部显示禁用）。
- `FormItemConfig` 支持 `checkedValue`/`uncheckedValue`；`FormWrap` 自动必填规则已改为 `required:true` + 自定义 validator（仅 `null/undefined/''` 算空），数字 0/1 不误判（2026-09-04，旧补丁已移除）。

## 通用 Table（src/components/Table）

- loading 用 vxe 原生 `:loading`（不要 NSpin）；`:column-config="{ resizable: true }"`；`show-overflow="'tooltip'"`。
- 搜索栏 `SearchBar/search-bar.vue`：Table 委托渲染（props `searchItems`/`searchModel`/`searchDefaultCollapsed`，emits `search`/`reset`），操作栏最右搜索按钮控显隐。折叠动画**只动 opacity+translateY**（0.2s），禁动画 height / `grid-template-rows:0fr`；收起用 `display:none`，状态留在父页面 model；每个界面各自声明 `searchItems`（末项 `{key:'actions',slot:'actions'}`），禁止跨界面共享函数。
- **detail 列复制图标（2026-09-07）**：图标已移出 `Link`（不再走 `#icon` 插槽），作为单元格内兄弟节点，点击无需 `.stop`；默认 `opacity:0;pointer-events:none` **常占位**（防行内跳动），hover 整行显形。判定两条并用：CSS `.vxe-body--row:hover` + JS 事件委托（表格容器 `@mouseover` 读 `tr[rowid]` 维护 `hoverRowId`，`:class="{'is-hover': hoverRowId===rowid}"`）。原因：vxe 把**固定列拆成独立 `<tr>`**，鼠标在主区行上时固定列 tr 没有 `:hover`，且 vxe 只维护内部 `hoverRow` 不落 class；slot 参数自带 `rowid`（vxe `body.js` 的 `cellParams`）。
- 复制图标颜色跟主题色：`useThemeVars()` 取 `primaryColor`/`primaryColorHover` → CSS 变量 `--vxe-copy-color`/`--vxe-copy-hover-color` 挂在图标上（主题切换自动跟随）。
- `Link`（`components/common/link.vue`）的 `iconPosition`/`iconHover`/`#icon` 已无调用方（保留未删）。

## 导出体系（v3，2026-09-05 定稿）

- 两套并存：右上 `action-export` = vxe 原生高级导出弹窗（ref 调 `openExport({type:'xlsx',filename,sheetName})`）；`TableExportAction` = exceljs 字段选择导出，由页面放**左侧操作栏**。
- 引擎：exceljs 动态 import 的 `export-xlsx.ts`（唯一出口）；`@vxe-ui/plugin-export-xlsx` 注册于 `src/plugins/vxe-table.ts`，只支撑原生导出。`exportRowsToXlsx` / `createDefaultExportName` 由 `@/components/Export` 导出。
- vxe 实例的 `exportData` 在核心 d.ts 无声明（插件运行时挂载）→ table.vue 用本地最小接口 `VxeExportableTable` 收敛。
- ⚠️ `typings/components.d.ts` 由 vite 插件生成（禁手改）；**已登记进其中的组件文件不能直接删**（残留引用致 typecheck 失败），保留 alias 文件（如 `Export/field-export.vue` → `table-export-action.vue`）待 dev/build 正常后再清理。
- 数据范围选项（exceljs 管线）：字段弹窗顶部「全部数据 / 当前页 / 勾选数据」，取 `fetchAll()`/`data`/`checkedData`；类型在 `Export/type.ts`（`ExportScope`、`ExportConfirmPayload`，confirm 事件传 payload 不是裸数组）；不传 `scopes` 则不渲染；默认有 fetchAll→全部否则当前页，每次打开重置，不可用项灰显。页面只需多传 `:checked-data`。
- 用户管理页是两套并存的示例页。

## vxe-table v4 树表（v4.5.9 踩坑）

- `tree-config` 必须显式带 `rowField`；缩进+箭头由列自身 `treeNode: true` 决定（`tree-config.treeNodeColumn` 本版本不生效）。
- 两种模式：parentId 扁平 + `{rowField,parentField,transform:true}`；或前端组树（`buildMenuTree`）+ `{rowField,childrenField}`。
- **树节点列不可被用户隐藏**：列设置禁用其开关，`useVxeTable` 以 `col.visible || col.treeNode` 兜底。
- 菜单管理页：DEV mock 返回扁平 + parentId，生产 `/system/menu/list` 返回嵌套 children 无 parentId。

## 系统设置页

- `system-manage_setting` 单一菜单，页面内 `NTabs` + 本地 `activeKey` 切子模块，子组件放 `setting/modules/*.vue`（**不是路由**，elegant-router 忽略 `modules/`），刷新回默认。
- 历史坑：子页曾放 `setting/<name>/index.vue` 被生成子路由 + 父路由自动 redirect，叠加守卫 replace → **重定向死循环卡死**。`transform.ts` 会给有 children 的路由自动加 redirect；`sa gen-route` 是交互式脚手架，全量重生成靠 `pnpm dev/build`。
- MasterDetail：**右侧内容是各页独有的，不是共用组件**。壳右侧 2026-09-04 已移除外层 `NScrollbar`（其 `min-h-full` 会让内容层随内容撑高 → 子卡片 `flex-1` 永不触发内部滚动、整块溢出），改为固定高度 `overflow-hidden` 容器 + `shrink-0` 操作栏，整体不滚、各页卡片自己内滚。`FieldMapping` 有可选 `fill` prop（NCard 变 `flex flex-1 min-h-0 flex-col`，content 内 NScrollbar 内滚）。`flex:1`（basis 0）≠ `flex-auto`（basis 取内容会撑高溢出）。
- 业务事实：字段映射只在录单格式存在，其余页面是模板复制的占位数据。既有坑：`modules/PrintFormat.vue` 有 6 个 `no-unused-vars` 误报 → 全库 lint / pre-commit 会失败，未处理。

## 按钮权限（前端静态配置，2026-09-05）

- 角色分配权限抽屉每行加「操作权限」列（NCheckboxGroup），勾选到按钮粒度。
- 清单在 `src/constants/button-permissions.ts`（`getMenuButtons({permission, routePath})`，命中即返回）；code 约定 `system:{模块}:{操作}`。
- 状态按菜单 id 存 `rowButtonChecks: Record<number,string[]>`（独立于搜索过滤）；提交随 `menuIds` 带 `buttonCodes`。
- **后端依赖未实现**：`assignMenu` 需落库 `buttonCodes`；回显需 `role/menuTree` 返回 `checkedButtonCodes`。

## 工具链 / 环境坑

- 本机 WebStorm `coding-copilot` 的 `node-safe-delete-shim` 会拦 vite 的 `rm`、也拦 `pnpm install/add`（报 `--file parameter is required`）。命令实际由 **PowerShell** 执行 → 用 `$env:NODE_OPTIONS=""; pnpm add -D xxx`（cmd 的 `set NODE_OPTIONS=` 无效）；dist 清空用 `Remove-Item -Recurse -Force dist`。build 报 `emptyDir` 时编译其实已成功，别当代码问题查。
- i18n 新增键三处同步：`locales/langs/zh-cn.ts`、`en-us.ts`、`typings/app.d.ts` 的 `App.I18n.Schema`。
- `pnpm release`（bumpp 交互式）：空仓库 `git describe` 需基准 tag `v0.0.0`；CHANGELOG 空行被 oxfmt 删会让 `git diff --exit-code` 失败 → 改用 bumpp **函数式 execute**（含 `&&` 的字符串会被误拆）先 `pnpm sa changelog` 再 `pnpm fmt`。
- archive-switch 布局：内容区不要多套 `<div class='absolute inset-0'>` 包 Transition+KeepAlive+defineAsyncComponent（切档案只剩微小 spinner）；根与右侧容器都 `overflow-hidden`。

## 字体（阿里巴巴普惠体子集化，2026-09-07）

- 提取脚本 `scripts/font/extract-i18n-charset.mjs`（跳过 `src/service` 的 DEV mock），采用整站静态表 765 汉字 / `zh-web-charset.txt`；用 Python fontTools `pyftsubset --flavor=woff2` 生成 `AlibabaPuHuiTi-subset.woff2`（116KB）。`cn-font-split` 的 `subsets` 是分包不是真子集，别用。
- **全局字体要覆盖三处**：① `styles/css/reset.css` 的 `html`；② Naive `NConfigProvider` theme-overrides（`store/modules/theme/shared.ts` 的 `getNaiveTheme()` 里 `common.fontFamily`，cssinjs 不吃 CSS 变量，需写完整字符串）；③ vxe 的 `:root{--vxe-ui-font-family}`，需在 `html:root` 覆盖。统一变量 `--app-font-family` 定义在 `styles/css/font.css`，但 Naive 的 TS 侧要同步改。
- `font-display: swap`；字体放 `src/assets/fonts/` 走 Vite hash，不放 public。改文案不会自动更新子集：`pnpm font:charset` / `pnpm font:build`。
- 源 `src/assets/fonts/source/Alibaba-PuHuiTi.otf`(6.53MB) 被 gitignore → 他人 clone 无法重建子集，需自备 otf。

## 其它

- 改通用组件前先确认实际链路（用户截图 → 页面 → 子组件）：设置页左侧列表是 `setting/components/MasterDetail.vue`，**不是**通用 Table；其状态徽标已改为实心彩色 NTag（暗黑模式文字 `#1f1f1f`）。
