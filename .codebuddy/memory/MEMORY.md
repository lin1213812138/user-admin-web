# MEMORY

> 跨会话长期记忆，按主题分组（括注定稿日期）。详细过程见同目录日报 `YYYY-MM-DD.md`，本文件只沉淀结论。

## 语言偏好（最高优先级）

- 所有内容一律中文（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」；库 API / 变量名 / 技术名词保留英文。

## 流程与原则

- **只改用户明确要求的代码**，不顺手动其它文件；不擅自回退用户已认可的方案，回退前先问。
- **造轮子禁区**：通用 UI 直接用 Naive UI + 扩展点（custom-request / slot），不得从零手写；确需自研须用户同意 + 先 brainstorming。
- 任何代码改动前必须先 brainstorming 出设计并经用户确认（AGENTS.md 规则 2）；讨论记录写 `changelog/` 并更新 `AGENTS_CHANGELOG.md` 索引（规则 1）。
- 需求不明确时**先回答 + 最小演示**，不自动启动长流程 / subagent 拆解。
- i18n 新增键同步 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`。

## Naive UI / FormWrap

- `Api.Common.EnableStatus = 0 | 1`（number）；NSwitch 绑数字须显式 `checkedValue`/`uncheckedValue`；status 列 `activeValue` 用 number `1`。
- FormWrap：必填仅 `null/undefined/''` 算空；`size` 透传 NForm（小尺寸用 `small`）。
- FormWrap 的 `select` **默认 `filterable`**（`FormItemConfig.filterable?: boolean`，`:filterable="item.filterable ?? true"`）→ 所有表单 + 搜索栏（SearchBar 复用 FormWrap）下拉都可输入搜索，个别传 `filterable: false` 关闭（2026-09-14）。
- FormWrap 控件类型（2026-09-14 扩容）：input/textarea/number/switch/select/color/checkbox/icon-picker/custom + **`section`（区块标题行，占整行、不包 NFormItem 不参与校验）/ `date`（NDatePicker，formatted-value + `yyyy-MM-dd`）/ `password` / `file` / `image`（NUpload，`default-upload=false` 单文件、值=文件名、受控 `file-list` 按 model 派生保回显、图片用内部 blob `uploadPreview` 预览）**。
- FormWrap 契约 = 父级传入响应式 `model`、子组件按字段写回；script 内写回会触发 `vue/no-mutating-props`，需局部 `eslint-disable` + 注明契约（模板 v-model 不触发该规则）。
- **`NDatePicker` 的 `formatted-value` 只接受 `string | null`**：传空串 `''` 会在 setup 抛 `RangeError: Invalid time value`（naive 内部 parseDate('')→Invalid Date→format 抛错）→ 整个表单/抽屉子树渲染中断（2026-09-14 用户报「点新增打不开弹窗」的根因）→ FormWrap 统一 `dateValue()`（空串→null）传入 + `@update:formatted-value` 回写空串。**通用教训：给 naive 受控组件传值前必须做空值口径转换（`''` ≠ `null`/`undefined`）**。
- **`FormItemRule.validator` 不要用 callback 风格**：naive 的 `FormItemRuleValidator` 返回类型 `boolean | Error | Promise<void> | Error[] | undefined` 不含 `void`，callback 风格（`callback(new Error())`）会触发 IDE TS2322；`pnpm typecheck` 带 `--skipLibCheck` **不报此错**（易漏）→ 统一写 `(_rule, value) => empty ? new Error(msg) : undefined`。**遇「IDE 报错但 pnpm typecheck 不报」用 `npx vue-tsc --noEmit` 严格口径复验**（2026-09-14）。
- naive 输入类组件 value===undefined 走非受控分支会残留旧值；buildModel 须补受控空值，**兜底 `??=` 放对象展开之后**（展开会拷贝显式 undefined）。
- NGrid `cols=24 + x-gap` 硬开销 = 23×gap（与 span 无关）；窄容器（<~370px）调小 `grid-x-gap`（属性面板 8）；`NGi` 用 `:deep(.n-grid > div)` 选中。
- NCollapse `arrow-placement="right"`：header slot 自身 `flex-1`。
- **NFormItem 坑**：空 label 仍占一行高度 → 显式 `:show-label="false"`（FormWrap 已透传）；`show-feedback` 默认 true 致嵌套双倍间距 → `:show-feedback="false"`。

## 通用 Table / vxe-table

- loading 用 vxe 原生；`column-config resizable`；`show-overflow="tooltip"`；搜索栏 `SearchBar/search-bar.vue`。
- 表头高度 35px 修复**已放弃回退**（prop/setConfig/CSS 均无法对齐主表区与固定列），保留 vxe 默认表头。
- 竖向撑满：`Table.vue` 包裹容器 `height==='100%'` 加 `flex-1 h-full`，不覆盖 vxe 内部 wrapper。
- 滚动条 `.vxe-table--scroll-y/-x-handle`：absolute 浮动 8px、hover 显形、`scrollbarConfig.height=0`；CSS 由 `src/plugins/vxe-table.ts` 运行时注入。
- 树表：`tree-config` 显式 `rowField`；`treeNode: true` 列不可隐藏；菜单页 DEV mock 扁平 + parentId。
- 导出两套：右上原生 `action-export` + 左侧 `TableExportAction`（exceljs）；范围 `fetchAll`/`data`/`checkedData`。
- `typings/components.d.ts` 自动生成，已登记组件不能直接删，先保留 alias。

## 系统管理模块

- **站点管理（2026-09-14）**：`views/system-manage/site/`（独立菜单 `system-manage_site`、icon `ic:round-place`、order 6 排系统设置后）；接口 `fetchGetSiteList|Create|Update|Delete`（DEV mock，生产 `/system/site/*`）；mock 编号查重抛「站点编号已存在」（抽屉 catch 兜底，真实接口错误由拦截器提示）；电话不校验；备注列默认隐藏；最后更新列插槽渲染「更新人 - 日期」；按钮权限 `system:site:*`（mock menus/MENU_TREE 已补菜单 id 25）。
- **组别管理（2026-09-14）**：`views/system-manage/group/`（`system-manage_group`、icon `ic:round-groups`、order 7 排站点管理后）；「所属站点」下拉关联站点（存 `siteId`，`siteName` 由 mock `withSiteName()` 按 siteId 实时解析、站点改名同步；页面与抽屉分别拉 `fetchGetSiteList({current:1,size:100})` 全量选项，抽屉每次打开刷新）；名称查重抛「组别名称已存在」；表格「创建」「最后更新」两列均按「人名 - 日期」插槽渲染；按钮权限 `system:group:*`（菜单 id 26）。
- **用户管理（2026-09-14 字段大改）**：User 扩至 25 字段（用户账号/用户名称/密码/用户角色/所属站点/所属组别/状态 + 个人档案 13 项）；旧 `userPhone`/`userEmail`/`role` 移除；`withUserNames()` 按 id 解析 roleName/siteName/groupName；抽屉两区块三列（`section` 分区、width 760）、密码编辑回显必填、状态改下拉；列表 8 列；角色/站点/组别下拉全量选项（`Promise.all` + 类型断言，每次打开刷新）。
- 状态筛选坑：`status` 的 0 是有效值，搜索参数用 `?? undefined`、mock 用 `=== 0 || === 1` 判断（旧页面 `status || undefined` 会吞「禁用」筛选）。

## 系统设置页

- `system-manage_setting` 单菜单 + 页内 `NTabs`；子组件 `setting/modules/*.vue` **不是路由**。
- MasterDetail 右侧容器固定高度 `overflow-hidden`、各卡片内滚；`flex:1` ≠ `flex-auto`。
- 录单格式字段映射 `FieldMapping.vue`（2026-09-14）：`modelValue = Record<groupKey, { show: string[]; required: string[] }>`；展示「☑ 字段名 ★」（★主题红=必填/☆灰=非必填，24×24 热区+hover 变红），未勾显示时星标不渲染但数据保留；勾选显示自动必填（取消显示不清除）；栅格 span 6；分组全选=全显示+全必填（取消不清除）。

## 标签设计器（label-designer，自研）

- **骨架/目录（2026-09-14 方案 A）**：工具栏 + 左 260px 字段面板 + 中画布 + 右 300px 属性面板（右侧 `bg-container` 白底、左侧透明）；分隔线 `border-#e5e7eb dark:border-#2a2a2a`；`modules/` 四组 `core/`（types、constant、basic-elements、export-format）、`render/`（barcode、render-utils、render-element-html）、`canvas/`（design-canvas、element-renderer、use-canvas-interaction、drag-ghost）、`panels/`（tool-bar、field-panel、property-panel、preview-modal、shortcut-help），各附中文 README；`index.vue` 在根。工具栏单行 `panels/tool-bar.vue`；i18n `labelDesign.title` 成死键未删。
- **单位（2026-09-12）**：元素几何全链路 **pt**、纸张 mm、字号 pt、边框/行距 px；`LabelTemplate.unit` 缺省按 mm ×PT_PER_MM；常量 `PX_PER_PT`/`PT_PER_MM`/`mmToPt`；默认字号统一 8pt。
- **存储格式（2026-09-12 B 方案）**：`{ unit:'pt', paper:{width,height,unit:'mm'}, elements }`，元素 `id,type,key,label,x,y,width,height,style,options`；转换在 `core/export-format.ts`；loadFromJson 三输入兼容（目标格式/旧 mm 迁移/非法回退）；映射 key←field、label←title、hideLabel←!showTitle、style.placeholder←text/value。**loadFromJson 不补默认字段 → 新增 options 字段必须在渲染层 `!== false` 兜底**。
- 保存链路：`handleSave()` → `fetchSavePrintTemplateDesign({ id, designJson, paperSize })` → 成功后 `previewTemplateJson()` 新标签页预览 JSON（Blob URL，`revokeObjectURL` 延迟 60s）。
- **拖拽（2026-09-14）**：pointerdown 建会话（`drag-ghost.ts`）+ `drag-preview.vue`（Teleport body，用画布 `ElementRenderer` 1:1 渲染）→ 按「指针 − 抓取偏移」定位；dragstart 用 1×1 透明图顶原生影子；dragend 已落纸淡出 120ms / 未落纸 rAF 回位（`BACK_MS=260`）。**禁止"自定义样式预览卡片"**。落点 = 预览左上角扣抓取偏移 + `Math.max(0,…)` 钳边界；有效性按指针在纸内；text 落纸尺寸用 drag-preview 实测（宽 50mm、高自适应、单行下限 = `fontSize × lineHeight × PX_PER_PT`，勿用类型默认 8mm 下限）→ `addElement(desc, at, size?)`。
- **拖动**：高频帧直写 DOM + dragPreview 通道，松手一次写 store；**pointerup 按 store 权威值回写 left/top/width/height（在 updateElement 之后）**；**禁用 will-change:transform**。
- **属性面板（2026-09-14）**：折叠区块 = 裸 NCollapse + item 内容包 `NCard size="small"` 白底卡（左右面板同款，今后照此）；样式项顺序 = 字号|颜色、字重|行高、水平对齐|垂直对齐、显示边框；「水平|垂直对齐」= 一个 span24 custom item（`alignGroup`）+ 嵌套两个 `NFormItem`（勿拆成两项），「行高」在其后。
- **标题+内容**：行内连续排版（inline span 前缀 + 半角冒号，间 8px），折行行首顶格；非文本元素用水平 flex；**label 永不上画布**；关联标题 = `FieldDef.showTitle && title`。
- **对齐（2026-09-14）**：`TextOptions.align` + `verticalAlign`（缺省 top，仅 text/longText）；渲染 = 外层 flex column `justify-content`（`vAlignToJustify()` 在 `render/render-utils.ts`，画布/打印共用）+ 内层 100% 宽 div 承载文本流（标题 span 不能直接做 flex 子项）。
- **字段类型可切换（2026-09-14）**：属性面板下拉（5 种数据类，矩形/线条除外）；`store.updateElementType()` = 保留共有键 + 内容互迁（`SWITCH_CONTENT_KEY`：text↔value，**image src 不参与**）+ 新类型默认补齐（migrated > kept > defaults）、尺寸重置、入撤销栈；**迁移后 options 只能有一个内容键**；面板 `fieldTypeSelect` 为 UI-only key；同文件多处 replace_in_file 不能并行。
- **文本高度自适应同口径**：拖入（drag-preview 实测）+ 类型切 text（`canvas/measure-element.ts`，`createApp` 挂离屏 ElementRenderer、`left:-9999px` 不能 display:none、异步只写 height）；longText 不实测（默认 16mm）。
- **光标（2026-09-14）**：左面板条目 `cursor-move` + `icon-mdi-drag` 把手（整条可拖）；画布 `grab` + `.panning * { grabbing !important }`；hover `hover:border-primary` + **`dark:hover:border-primary` 必须单独写**；文字变色用 scoped `.field-entry:hover .entry-title`（**`group-hover:` 不生效**）；`--primary-color` 为 `r g b` 格式。
- **选中态禁止提升 z-index（2026-09-14 教训）**：会挡住 hit-test；命中须按 DOM 堆叠顺序，手柄自身 `z-index: 5`。
- 数据模型：`DataPreviewExtras`（title/showTitle/placeholder）+ `BorderExtras`（showBorder/borderWidth/borderColor，默认关 1px 黑）挂 text/longText/barcode/qrcode options；画布 `element-renderer.vue` 与打印 `render-element-html.ts` **必须同步改**。
- `resolveDisplayText` 回退链：示例内容 → placeholder → `{{field}}`；业务字段拖入类型由 `FieldDef.elementType` 决定（映射表 `FIELD_TYPE_LABEL_KEYS`）；基础元素默认示例：文本 `文本示例` / 图片用内嵌 SVG `IMAGE_PLACEHOLDER_SRC`（纯 ASCII，`#`→`%23`）/ 条码 `123456` / 二维码 `https://example.com`；**不用 placeholder 占位方案**。
- 字段示例内容兜底 `fieldSampleOf()` 已于 2026-09-14 **撤销，勿重做**；教训：`??` 兜不住空字符串、预览与落纸两处必须同改。
- bwip-js：数值参数 NaN 抛 `invalidOptionType`，可选数值须 `|| 默认值`。
- **本地端到端不可达（2026-09-14）**：dev = `pnpm dev --port 9112 --strictPort`；受保护页被守卫重定向登录、一键登录接口无后端必 500；验证靠 typecheck + 单文件 lint + 代码级证据链。`.playwright-cli/` 是本地产物目录（可清理）。

## 打印设计页（hiprint，旧方案）

- 预览必须直接 `instance.getHtml()`，**禁止 getJson → 新建 PrintTemplate → getHtml round-trip**；`handlePreview` 先 blur + nextTick + setTimeout(0)。
- 三处滚动区用 `NScrollbar`；整页滚动禁用（body `.print-design-no-scroll`）。
- hiprint API：选中事件 `getPrintElementSelectEventKey()`；写回 `updateOption()`（**禁 `submitOption()`**）；复杂字段用 `item.createTarget()` 兜底 DOM。2026-09-11 决策：放弃自定义右侧属性面板，还原原生 `settingContainer: '#Setting'`。

## 按钮权限

- 角色权限抽屉「操作权限」列；清单 `src/constants/button-permissions.ts`，code `system:{模块}:{操作}`；状态 `rowButtonChecks`，随 `menuIds` 提交 `buttonCodes`；后端落库/回显待实现。

## 工具链 / 环境

- 只用 **pnpm**；WebStorm `node-safe-delete-shim` 拦截 vite rm / pnpm install → PowerShell 先 `$env:NODE_OPTIONS=""`。
- **elegant-router 扫描规则**：仅 `**/index.vue`、`**/[[]*[]].vue` 生成路由；`pageExcludePatterns = ["**/components/**"]` → `views/**/modules/` 下任意嵌套 .vue 安全。
- **`pnpm gen-route` 现不可用**（`.bin/sa.cmd` 指向已删 `bin.ts`）→ 路由重新生成用 `pnpm dev` 触发；勿用 `node @sa/scripts/bin.mjs gen-route`（交互式向导）。
- **elegant-router 生成行为（2026-09-14 实战）**：① 改 `build/plugins/router.ts`（routeIcons/routeOrders）后**必须先删 `node_modules/.vite-temp`** 再跑 dev，否则 vite 复用缓存的旧配置生成（新路由无 meta、旧 order 不更新）；② 生成器**保留已存在条目的旧 meta**（改配置里的 order 对已有路由不生效），仅新条目按配置写；③ **order 与已有值重复会顺移**（site:5 撞 label-designer:5 → 实际生成 6）⇒ 以产物为准把配置对齐（配置=生成结果）；④ 生成偶发把 `routes.ts` 末行写坏（重复残片）→ 下次 dev 启动 Babel `MissingSemicolon` 直接失败，修复 = `git checkout -- src/router/elegant/routes.ts` + 清 `.vite-temp` + 重跑 dev；⑤ `routes.ts` 尾部 `nonMenuRoutes`/`menuRoutes` 段是项目定制（HEAD 即有），生成器会保留；⑥ **想让配置改动对已有路由生效**：从 `routes.ts` 删除目标条目 → 清 `.vite-temp` → 跑 dev（重新作为新条目按配置写入；比全量删文件安全，定制段不丢）——2026-09-14 已实战验证（站点/组别/设置 order 重建）。
- **sa shim / commit-msg 报 `ERR_MODULE_NOT_FOUND ... bin.ts` 正解 = `pnpm install --force`**（先清 `NODE_OPTIONS`）重建全部 shim；普通 install 会跳过，手改 shim 是假象。
- pre-commit = `typecheck && lint && fmt && git diff --exit-code`（工作区不能有未暂存改动）。
- 推送 GitHub TLS/EOF 正解：`$env:HTTPS_PROXY="http://127.0.0.1:7897"; git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=300 push`（AI 不代改 git config）。
- 阿里巴巴普惠体子集化：`scripts/font/extract-i18n-charset.mjs` + `pyftsubset`；字体覆盖三处（reset.css html、Naive theme-overrides、`--vxe-ui-font-family`）。
