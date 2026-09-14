# MEMORY

> 跨会话长期记忆，按主题分组（括号内为定稿日期）。详细过程见同目录日报 `YYYY-MM-DD.md`，本文件只沉淀结论。

## 语言偏好（最高优先级）

- 所有输出一律中文（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」；库 API / 变量名 / 技术名词保留英文。

## 流程与原则

- **只改用户明确要求的代码**，不顺手动其它文件；不擅自回退用户已认可的方案（回退前先问）。
- 任何代码改动前先 brainstorming 出设计并经用户确认（AGENTS.md 规则 2），**确认前不写代码、不建文件**；讨论记录写 `changelog/<取自用户提示词>.md` 并追加条目到 `AGENTS_CHANGELOG.md`（规则 1，日期最新在上）。
- **造轮子禁区**：通用 UI 用 Naive UI + 扩展点（custom-request / slot），不得从零手写；确需自研须用户同意 + 先 brainstorming。
- 需求不明确时**先回答 + 最小演示**，不自动启动长流程 / subagent 拆解。
- i18n 新增键必须同步 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`。

## Naive UI / FormWrap

- `Api.Common.EnableStatus = 0 | 1`（number）；NSwitch 绑数字须显式 `checkedValue`/`uncheckedValue`；status 列 `activeValue` 用 number `1`。
- FormWrap：必填仅 `null/undefined/''` 算空；`select` 默认 `filterable`（个例传 false）；控件 input/textarea/number/switch/select/color/checkbox/icon-picker/date/password/file/image/custom + `section`（区块标题行，占整行、不参与校验）。
- FormWrap `mode: 'edit' | 'view'`（2026-09-14）：view = 只读**文本**展示（详情态一律用它，别再 `:disabled="isDetail"`）；select 反查 options label、password 固定 `••••••`、空值灰色 `-`（0/false 算有效）；view 态不校验、无必填星号。
- FormWrap 契约 = 父级传响应式 `model`、子组件按字段写回；script 内写回触发 `vue/no-mutating-props` → 局部 `eslint-disable` + 注明契约（模板 v-model 不触发）。
- **给 naive 受控组件传值前必须做空值口径转换（`''` ≠ `null`/`undefined`）**：NDatePicker `formatted-value` 收空串抛 `RangeError: Invalid time value` 并中断整棵子树（曾致「点新增打不开弹窗」）→ 空串转 null + `@update:formatted-value` 回写空串；输入类 `value===undefined` 走非受控会残留旧值 → buildModel 补受控空值，兜底 `??=` 放对象展开之后。
- **`FormItemRule.validator` 不用 callback 风格**：统一 `(_rule, value) => empty ? new Error(msg) : undefined`；「IDE 报错但 pnpm typecheck 不报」用 `npx vue-tsc --noEmit` 严格口径复验。
- NGrid `cols=24 + x-gap` 硬开销 = 23×gap（与 span 无关），窄容器（<~370px）调小 `grid-x-gap`，NGi 用 `:deep(.n-grid > div)` 选中；NFormItem 空 label 仍占一行高 → `:show-label="false"`，`show-feedback` 默认 true 致嵌套双倍间距 → `:show-feedback="false"`；NCollapse `arrow-placement="right"` 时 header slot 自身 `flex-1`。

## 通用 Table / vxe-table

- `table-column-config.vue`（列设置弹窗）+ `useVxeTable`：列配置缓存写裸 `localStorage['vxe-table-column:<cacheKey>']`（本项目唯一存储例外，不走 `localStg`）；`resetColumns()` = 恢复 `options.columns()` 默认 + 清缓存，**注意历史上从未被任何页面调用过**。
- loading 用 vxe 原生；`column-config resizable`；`show-overflow="tooltip"`；搜索栏用 `SearchBar/search-bar.vue`。
- 表头高度 35px 修复**已放弃回退**，保留 vxe 默认表头；竖向撑满靠 `Table.vue` 包裹容器 `height==='100%'` 加 `flex-1 h-full`。
- 滚动条 `.vxe-table--scroll-x/-y-handle`：absolute 浮动 8px、hover 显形、`scrollbarConfig.height=0`；CSS 由 `src/plugins/vxe-table.ts` 运行时注入。
- 树表：`tree-config` 显式 `rowField`；`treeNode: true` 列不可隐藏；菜单页 DEV mock 扁平 + parentId。
- 导出两套：右上原生 `action-export` + 左侧 `TableExportAction`（exceljs，范围 `fetchAll`/`data`/`checkedData`）；`typings/components.d.ts` 自动生成，已登记组件不能直接删，先保留 alias。

## 系统管理模块

- 站点 `views/system-manage/site/`（`system-manage_site`、order 6，2026-09-14）：`fetchGetSiteList|Create|Update|Delete`（DEV mock，生产 `/system/site/*`）；编号查重；备注列默认隐藏；「最后更新」列按「人名 - 日期」插槽；按钮权限 `system:site:*`（菜单 id 25）。
- 组别 `views/system-manage/group/`（`system-manage_group`、order 7，2026-09-14）：「所属站点」存 `siteId`，`siteName` 由 mock `withSiteName()` 实时解析；名称查重；页面与抽屉各自拉站点选项、抽屉每次打开刷新；按钮权限 `system:group:*`（菜单 id 26）。
- 用户（2026-09-14 字段大改）：25 字段；`withUserNames()` 解析 roleName/siteName/groupName；抽屉两区块三列（width 760）、密码编辑必填、状态下拉；列表 8 列；角色/站点/组别下拉全量选项（`Promise.all` + 每次打开刷新）。
- 部门管理**页面从未实现**，其在权限树 / 菜单管理 / 按钮权限清单里的显示已于 2026-09-14 移除，**勿再加回**。
- 状态筛选坑：`status === 0` 是有效值，搜索参数用 `?? undefined`、mock 用 `=== 0 || === 1` 判断。

## 系统设置页

- `system-manage_setting` 单菜单 + 页内 `NTabs`；`setting/modules/*.vue` **不是路由**。
- MasterDetail 右侧容器固定高度 `overflow-hidden`、各卡片内滚；`flex:1` ≠ `flex-auto`。
- 录单格式字段映射 `FieldMapping.vue`：`modelValue = Record<groupKey, { show: string[]; required: string[] }>`；展示「☑ 字段名 ★」，未勾显示时星标不渲染但数据保留；勾显示自动必填（取消显示不清除）；分组全选 = 全显示 + 全必填。

## 标签设计器（label-designer，自研）

- 骨架（方案 A）：工具栏 + 左 260px 字段面板 + 中画布 + 右 300px 属性面板；`modules/` 分 `core/`（types、constant、basic-elements、export-format）、`render/`（barcode、render-utils、render-element-html）、`canvas/`（design-canvas、element-renderer、use-canvas-interaction、drag-ghost）、`panels/`（tool-bar、field-panel、property-panel、preview-modal、shortcut-help）。
- 单位：几何全链路 **pt**、纸张 mm、字号 pt；常量 `PX_PER_PT`/`PT_PER_MM`/`mmToPt`；默认字号 8pt；存储 `{ unit:'pt', paper, elements }`；转换在 `core/export-format.ts`；`loadFromJson` 三输入兼容且**不补默认字段 → 新增 options 字段必须在渲染层 `!== false` 兜底**。
- 保存：`handleSave()` → `fetchSavePrintTemplateDesign` → 成功后新标签页预览 JSON（Blob URL，延迟 revoke）。
- 拖拽：pointerdown 建会话 + `drag-preview.vue`（Teleport body，用画布 `ElementRenderer` 1:1 渲染，**禁止「自定义样式预览卡片」**）；落点 = 预览左上 − 抓取偏移 + 钳边界；有效性按指针在纸内；文本落纸尺寸实测（宽 50mm、单行下限 = `fontSize × lineHeight × PX_PER_PT`）。
- 拖动：高频帧直写 DOM、松手一次写 store；pointerup 按 store 权威值回写几何；**禁用 will-change:transform**。
- 属性面板：折叠区 = 裸 NCollapse + item 内包 `NCard size="small"`（今后照此）；「水平|垂直对齐」= 一个 span24 custom item 内嵌两个 NFormItem；样式项顺序 字号|颜色、字重|行高、对齐、显示边框。
- 排版：标题+内容行内连续（inline span + 半角冒号）；**label 永不上画布**；`TextOptions.align`/`verticalAlign` → 外层 flex column `justify-content`（`vAlignToJustify()`）+ 内层 100% 宽 div 承载文本流。
- 字段类型可切换：`store.updateElementType()` = 留共有键 + 内容互迁（`SWITCH_CONTENT_KEY`：text↔value，image src 不参与）+ 新类型默认补齐 + 尺寸重置 + 入撤销栈；迁移后 options 只能有一个内容键。
- 光标：左面板条目 `cursor-move`；画布 `grab` + `.panning * { grabbing !important }`；hover 用 scoped `.field-entry:hover`（`group-hover:` 不生效）；`--primary-color` 为 `r g b`。**选中态禁止提升 z-index**（会挡 hit-test），命中按 DOM 堆叠顺序，手柄 `z-index: 5`。
- 画布 `element-renderer.vue` 与打印 `render-element-html.ts` **必须同步改**；`resolveDisplayText` 回退链 = 示例内容 → placeholder → `{{field}}`；基础元素默认示例：文本 `文本示例` / 图片内嵌 SVG `IMAGE_PLACEHOLDER_SRC`（纯 ASCII，`#`→`%23`）/ 条码 `123456` / 二维码 `https://example.com`。
- `fieldSampleOf()` 兜底已于 2026-09-14 **撤销，勿重做**（教训：`??` 兜不住空字符串、预览与落纸两处必须同改）；bwip-js 可选数值参数 NaN 抛 `invalidOptionType` → 用 `|| 默认值`。
- 本地端到端不可达：dev = `pnpm dev --port 9112 --strictPort`；受保护页被守卫重定向登录、无后端 → 验证靠 typecheck + 单文件 lint + 代码级证据链。

## 打印设计页（hiprint，旧方案）

- 预览必须直接 `instance.getHtml()`，禁止 getJson → 新建 PrintTemplate → getHtml round-trip；`handlePreview` 先 blur + nextTick + setTimeout(0)。
- 三处滚动区用 `NScrollbar`，整页滚动禁用（body `.print-design-no-scroll`）；hiprint API：选中事件 `getPrintElementSelectEventKey()`、写回 `updateOption()`（**禁 `submitOption()`**）、复杂字段用 `item.createTarget()` 兜底 DOM；2026-09-11 决策：放弃自定义右侧属性面板，还原原生 `settingContainer: '#Setting'`。

## 按钮权限

- 角色权限抽屉「操作权限」列；清单 `src/constants/button-permissions.ts`，code `system:{模块}:{操作}`；状态 `rowButtonChecks`，随 `menuIds` 提交 `buttonCodes`；后端落库/回显待实现。
- 角色权限抽屉的菜单树**只显示「菜单名称 + 操作权限」两列**；行数据 `routePath`/`permission` 仍用于按钮权限匹配与「首页必选」判定，搜索框仍按三者匹配。

## 工具链 / 环境

- 只用 **pnpm**；WebStorm `node-safe-delete-shim` 拦截 vite rm / pnpm install → PowerShell 先 `$env:NODE_OPTIONS=""`。
- elegant-router：仅 `**/index.vue`、`**/[[]*[]].vue` 生成路由，`pageExcludePatterns = ["**/components/**"]` ⇒ `views/**/modules/` 下任意嵌套 .vue 安全；禁止手改 `router/elegant/**` 与 `typings/elegant-router.d.ts`。
- **`pnpm gen-route` 不可用**（`.bin/sa.cmd` 指向已删 `bin.ts`）→ 重新生成用 `pnpm dev` 触发（勿用交互式 `node @sa/scripts/bin.mjs gen-route`）。
- elegant-router 生成行为：改 `build/plugins/router.ts` 后先删 `node_modules/.vite-temp`；生成器保留已有条目的旧 meta，order 重复会顺移；末行偶发写坏 → `git checkout -- src/router/elegant/routes.ts` + 清 `.vite-temp`；想让新配置对已有路由生效 = 从 `routes.ts` 删该条目再跑 dev。
- **sa shim / commit-msg 报 `ERR_MODULE_NOT_FOUND ... bin.ts` 正解 = `pnpm install --force`**（先清 `NODE_OPTIONS`）；pre-commit = `typecheck && lint && fmt && git diff --exit-code`（工作区不能有未暂存改动）。
- 推送 GitHub TLS/EOF：`$env:HTTPS_PROXY="http://127.0.0.1:7897"; git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=300 push`（不代改 git config）。
- 阿里巴巴普惠体子集化：`scripts/font/extract-i18n-charset.mjs` + `pyftsubset`；字体覆盖三处（reset.css html、Naive theme-overrides、`--vxe-ui-font-family`）。
