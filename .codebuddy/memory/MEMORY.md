# MEMORY

## 语言偏好（最高优先级）

- 用户要求**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」。库 API / 变量名 / 技术名词保留英文。

## 状态字段 / FormWrap / Naive 通用事实

- `Api.Common.EnableStatus = 0 | 1`（number，1 启用 0 禁用）；NSwitch 绑数字显式 `checkedValue`/`uncheckedValue`；status 列 `activeValue` 用 number `1`。
- FormWrap：必填规则仅 `null/undefined/''` 算空；支持 `size` prop 透传 NForm（小尺寸场景 `size="small"`，属性面板另用 scoped 把 label 压到 12px）。
- naive 输入类组件 value===undefined 走非受控分支（回落实例内部值），跨数据源复用实例会残留旧值并被输入污染；修法：buildModel 对可能缺失的键补受控空值，**兜底放对象展开之后（`??=`）**——展开会拷贝显式 undefined，前置默认值会被吃掉。
- NGrid `cols=24 + x-gap` 硬开销 = 23×gap 与 span 无关；窄容器（<~370px）必须调小 `grid-x-gap`（属性面板用 8）。GridItem 渲染的 div **无 class**，要选中 NGi 写 `:deep(.n-grid > div)`。
- NCollapse `arrow-placement="right"` 箭头贴右：header slot 自身 `flex-1` 撑满。
- **NFormItem 两个默认值坑**：`show-label` 默认 **true**（源码 `showLabel ?? NForm.showLabel ?? true`，**不判断 label 是否为空**）→ label 为空的 item 文字不渲染但**栅格仍留一行 label 高度**，需显式 `:show-label="false"`（`FormWrap` 已加 `showLabel?: boolean` 透传）；`show-feedback` 默认 **true** → 每个 form-item 底部有 feedback 占位，**嵌套 NFormItem 会叠加成双倍间距**，需 `:show-feedback="false"`。

## 通用 Table / vxe-table

- loading 用 vxe 原生；`column-config resizable`；`show-overflow="tooltip"`；搜索栏由 `SearchBar/search-bar.vue` 渲染。
- **表头高度 35px 修复已整体放弃并回退**（prop / VxeUI.setConfig / scrollbar.css 表头规则等均无法对齐主表区与固定列），保留 vxe 默认表头行为。
- 竖向撑满用组件层修复：`Table.vue` 包裹容器 `height==='100%'` 时加 `flex-1 h-full`；不覆盖 vxe 内部 wrapper。
- 滚动条在 `.vxe-table--scroll-y/-x-handle`（原生滚动）：`position:absolute` 浮动 8px、hover 表格才显形（opacity + `scrollbar-width:thin`）、`scrollbarConfig.height=0` 消除底部预留；CSS 由 `src/plugins/vxe-table.ts` 运行时注入 head 末尾。
- 树表：`tree-config` 显式 `rowField`；`treeNode: true` 列不可隐藏。菜单页 DEV mock 扁平 + parentId，生产嵌套 children。

## 导出体系

- 两套并存：右上原生 `action-export` + 左侧 `TableExportAction`（exceljs）；数据范围 `fetchAll`/`data`/`checkedData`，类型在 `Export/type.ts`。
- `typings/components.d.ts` 自动生成，已登记组件不能直接删，先保留 alias 文件。

## 系统设置页

- `system-manage_setting` 单菜单，页内 `NTabs` 切子模块；子组件放 `setting/modules/*.vue`，**不是路由**。
- MasterDetail 右侧容器固定高度 `overflow-hidden`，各页卡片自己内滚；`flex:1` ≠ `flex-auto`。
- 录单格式字段映射（`FieldMapping.vue`）：`modelValue` = `Record<groupKey, { show: string[]; required: string[] }>`（2026-09-14 定稿）；展示定稿「复选框 + 必填星标」= `☑ 字段名 ★`（★ 主题红=必填 / ☆ 灰=非必填，**24×24 固定热区** + hover 浅灰底/变红），未勾显示时星标不渲染（数据保留）；**勾选显示时默认自动必填**（取消显示不清除）；两个控件均有 NTooltip（勾选框→`common.show`「显示」、星标→`page.manage.setting.fieldMappingRequired`「必填」）；默认栅格 span 6（一行 4 个）；**分组一键全选 = 全部显示 + 默认全部必填**（`toggleGroup` 同步合并 required，取消全选不清除；按钮计数仍只统计显示维度）。

## 标签设计器（label-designer，自研）

- 页面骨架（`index.vue`）：工具栏 + 左 260px 字段面板 + 中间画布 + 右 300px 属性面板；**右侧栏 `bg-container` 白底、左侧栏保持透明**（2026-09-14 定稿：先两侧加白、后按用户要求左侧回退透明），分隔线 `border-#e5e7eb dark:border-#2a2a2a`。
- 拖拽预览：**「按下即显示的真实渲染预览」定稿**（2026-09-14，`drag-ghost.ts` 会话模型 + 新组件 `drag-preview.vue`）——会话从 **pointerdown** 开始（不等 dragstart）：`beginDragPreview` 建 session + 构建预览元素（store 导出的 `defaultOptionsFor`/`defaultSize`，与落纸元素同源）→ `drag-preview.vue`（Teleport body）用画布 `ElementRenderer` 1:1 渲染（无装饰）→ nextTick 后按「指针 − 抓取偏移」定位；dragover 更新 left/top 跟手；**dragstart 用 1×1 透明图顶掉原生影子 + 必须摘掉 pointerup 点击判定监听**（HTML5 拖拽期 pointerup 不触发，会残留误触发；`pointercancel` 兜底）；pointerup（点击）→ 立即收起；dragend → 已落纸淡出 120ms / 未落纸 rAF 补间回位（`BACK_MS=260`）。落纸位置 = 预览左上角（`getDragOffset` 读 session 抓取偏移）。**不要引入"自定义样式"的预览卡片**（用户否过蓝框卡片）。
- 拖入落点：**元素按「预览左上角」创建**（2026-09-14）——`onDrop` 先用 `getDragOffset()`（drag-ghost 导出）扣除抓取偏移再换算纸张坐标、`Math.max(0,…)` 钳左上边界，**不要**把指针直接当元素左上角；落点有效性仍按指针是否在纸张内判定。元素与预览尺寸不同 → 左上角对齐（非完全重合）。
- **文本类型落纸尺寸（2026-09-14 定稿）**：宽 **50mm**（`defaultSize('text')`）、**高按内容自适应** —— 预览容器 text 用 `height:auto` + **`minHeight = 单行高度`（`fontSize × lineHeight × PX_PER_PT`，缺省 8pt/1.2 ≈ 3.4mm）**；**不要用类型默认高度 8mm 做下限**（比单行内容还高、会撑大元素掩盖自适应）→ drag-ghost 实测 `offsetHeight/PX_PER_PT` 存会话 → `onDrop` 经 `textDropSize()` 用 `addElement(desc, at, size?)` 覆盖。其它类型仍用 `defaultSize` 固定尺寸。
- 拖动：高频帧直写 DOM + dragPreview 显示通道，松手一次写 store；**pointerup 必须按 store 权威值回写 left/top/width/height（放 updateElement 之后）**，纯清空会因 Vue 不重渲染导致元素飞到左上角。**禁用 will-change:transform**（合成层栅格化舍入致视觉抖动 1~2px）。
- 属性面板：位置与尺寸 / 数据预览 / 样式 / 删除按钮；**折叠区块定稿模式 = 裸 NCollapse（header `<span class="flex-1">`）+ 每个 item 内容包 `NCard size="small"` 白底描边卡**，左右面板同款，今后加折叠区块照此。
- **样式卡「水平对齐 | 垂直对齐」= 一个 span 24 的 custom item（`alignGroup`）+ slot 内两个嵌套 `NFormItem`**（2026-09-14 定稿）：流式栅格下前序 span 奇偶（titleStyleItems 3 项）会把两个 span12 项拆行、纯排序无法两全；外层 `label: ''`（naive `!labelText` 不渲染 label）；选项 `alignOptions`/`valignOptions`；「行高」排在对齐组之后。
- 标题+内容：**行内连续排版**（inline span 前缀 + 半角冒号、随显隐、间 8px），折行行首顶格；仅非文本元素用水平 flex 左标题右内容；**label 永不上画布**；关联标题 = `FieldDef.showTitle && title` 同时为真（缺省不显示）。
- 数据模型：`DataPreviewExtras`（title/showTitle/placeholder）+ `BorderExtras`（showBorder/borderWidth/borderColor，默认关 1px 黑）挂 text/longText/barcode/qrcode options；画布 `element-renderer.vue` 与打印 `render-element-html.ts` **两处必须同步改**。
- 默认字号统一 8pt（2026-09-12 用户定稿）：store `defaultOptionsFor` 新建默认 text/barcode `fontSize` 与各 `titleFontSize` 均 8，渲染层缺省回退（`??8`/`||8`）与两端同步；用户嫌之前的 12/10 太大。
- **几何单位定稿（2026-09-12）**：元素 x/y/width/height 全链路 **pt**（属性面板/存储/画布/打印），**纸张保留 mm**；`LabelTemplate.unit` 缺省视为 mm 自动迁移 ×PT_PER_MM，toJson 写 'pt'；换算常量在 constant.ts（`PX_PER_PT`/`PT_PER_MM`/`mmToPt`）。字号 pt、边框/行距 px、纸张 mm、几何 pt——四类单位并存。
- `resolveDisplayText` 回退链：示例内容 → placeholder → `{{field}}`。
- 业务字段拖入类型由 `FieldDef.elementType` 决定（缺省 text），映射表在 design-canvas.vue `FIELD_TYPE_LABEL_KEYS`；改默认类型直接改 `BUSINESS_FIELDS`。
- **loadFromJson 不补默认字段，新增 options 字段必须做旧数据兼容**（渲染层 `!== false` 兜底）。bwip-js：数值参数喂 NaN 抛 `invalidOptionType`，可选数值必须 `|| 默认值`；调试用 node `toBuffer` 渲 PNG 即可。
- `fieldTypeSelect` 是 UI-only key（2026-09-14 替换原 `fieldTypeDisplay`：改存 `ElementType` 值、驱动「字段类型」可编辑下拉），提交 options 前过滤；同文件多处 replace_in_file 不能并行（后写覆盖先写）。
- 工具栏单行（2026-09-12）：模板选择/撤销重做/纸张/网格/缩放/预览/保存全部在 `tool-bar.vue`（props: templates/currentId/loading，emits: templateChange/save/preview），index.vue 无独立头部行；i18n `labelDesign.title` 成死键未删。
- 保存链路：index.vue `handleSave()` → `fetchSavePrintTemplateDesign({ id, designJson: store.toJson(), paperSize })`；**保存成功后 `previewTemplateJson()` 新标签页预览 JSON**（window.open Blob URL，revokeObjectURL 延迟 60s 防新标签空白；2026-09-12 由下载文件改来，用户要求）。
- **designJson 目标存储格式（2026-09-12 定稿，B 方案）**：顶层 `{ unit:'pt', paper:{width,height,unit:'mm'}, elements }`，元素=`id,type,key,label,x,y,width,height(pt),style,options`；转换全在 `label-designer/modules/core/export-format.ts`（`toExportTemplate`/`parseTemplateJson`），store 只剩一行调用；loadFromJson 三输入兼容（目标格式 options 优先反推 / 旧原生 mm 自动迁移 pt / 非法回退空模板）；映射 key←field、label←title、hideLabel←!showTitle、style.placeholder←text/value、fontFamily 补 Microsoft YaHei；**内部几何已并行 pt 化（types LabelTemplate.unit?:'mm'|'pt'，缺省 mm 旧数据）**，序列化 pt 直传不换算。
- **目录结构（2026-09-14 整理，方案 A，已完成）**：`modules/` 分 4 组——`core/`（types/constant/basic-elements/export-format）、`render/`（barcode/render-utils/render-element-html）、`canvas/`（design-canvas/element-renderer/use-canvas-interaction/drag-ghost）、`panels/`（tool-bar/field-panel/property-panel/preview-modal/shortcut-help）；只移动不重命名，`index.vue` 留在根；模块附中文 `README.md`（使用方法/结构/约定/扩展/维护）。此前各条目中的 `modules/xxx.ts` 路径均已加组名前缀。
- **水平/垂直对齐定稿（2026-09-14）**：`TextOptions.align`（left/center/right，水平）+ `verticalAlign?: 'top'|'middle'|'bottom'`（缺省 top，取值与导出格式 `style.verticalAlign` 的 CSS 语义一致、直传不映射）；文本渲染两端 = 外层 flex column `justify-content`（映射函数 `vAlignToJustify()` 在 `render/render-utils.ts`，画布/打印共用）+ 内层 100% 宽 div 承载「标题前缀+内容」文本流——**标题 span 与文本节点不能直接做 flex 子项，会被拆成两块断行**；导出读真实值、回读 `pickVAlign`、缺字段两端兜底 top；属性面板样式项顺序 = 字号|颜色、字重|行高、水平对齐|垂直对齐、显示边框，字重/对齐选项中文走 i18n（`weightNormal/Bold`、`alignLeft/Center/Right`、`valignTop/Middle/Bottom`）；范围仅 text/longText，条码/二维码/图片/矩形线条无对齐项。
- **字段类型可切换（2026-09-14 定稿）**：属性面板「字段类型」下拉可编辑（5 种数据类，矩形/线条不参与）；`store.updateElementType(id, type)` = 保留共有键（`k in defaults || EXTRA_OPTION_KEYS`，兜底 `placeholder`）+ 内容互迁（`SWITCH_CONTENT_KEY`：text/longText 的 `text` ↔ barcode/qrcode 的 `value`；**image `src` 不参与**）+ 新类型默认补齐，合并顺序 `migrated > kept > defaults`，尺寸重置为新类型默认（位置不变）、入撤销栈；**迁移后 options 只能有一个内容键**（`resolveDisplayText` 按 text→value→src 优先取，残留空 text 会遮蔽 value）。面板侧 `fieldTypeSelect` UI-only，`watch(model)` 拦截后 `buildModel()` 重建受控值。
- **文本高度自适应两条路径必须同口径（2026-09-14）**：① 拖入落纸 = drag-preview（`height:auto` + 单行下限）实测 `offsetHeight/PX_PER_PT` → `textDropSize()`；② **类型切换到 text = `canvas/measure-element.ts` 的 `measureElementHeight()`**（`createApp` 挂 `ElementRenderer` 的离屏宿主，同口径、`left:-9999px` 移出视口，**不能 display:none**），异步只写回 height、不额外 commit（undo 一步回退）；仅 `text` 自适应，longText 与拖入行为一致不实测（默认 16mm）。
- **光标约定（2026-09-14 用户定稿）**：左侧面板拖拽条目 = `cursor-move`（四向十字箭头，**不要手型**，无按压态变体）；画布容器/平移 = `cursor: grab` + `.panning * { grabbing !important }`（两组语义不同，勿一并改）。左侧条目文字前另有拖拽把手图标 `icon-mdi-drag`（六点，`text-#8c8c8c dark:text-#999`，沿用表格列配置先例；**整条可拖**、图标仅视觉提示）；条目 hover 高亮 = `hover:border-primary dark:hover:border-primary`（**暗黑变体必须单独写 `dark:hover:`**：与 `dark:border-*` 同特异性时源顺序不可靠）+ 文字色由 **scoped CSS** `.field-entry:hover .entry-title { color: rgb(var(--primary-color, 32 128 240)) }` 承担 —— **本项目 hover 联动变色勿用 `group-hover:` 变体（实测未生效，无项目先例）**；主题色变量 `--primary-color` 为 `r g b` 格式（`src/theme/vars.ts`）。
- **选中态不得提升 z-index（2026-09-14 bug 修复教训）**：`.is-selected` 曾加 `z-index: 10` → 「矩形置底并选中后，点中间文本永远选不中」（透明背景视觉可见、hit-test 却优先命中选中元素）；命中必须遵循 DOM 堆叠顺序；手柄靠自身 `z-index: 5`（定位子元素、`.element-item` 不创建堆叠上下文）浮在上层可拖，**不依赖**元素提升层级。
- **本地浏览器端到端事实（2026-09-14）**：dev = `pnpm dev --port 9112 --strictPort`（test 模式）；playwright 打开受保护页会被守卫重定向登录，一键登录接口 `/proxy-default/api/v1/user/login` **无后端必 500** → 项目内浏览器端到端不可达，改动验证以 typecheck + 单文件 lint + 代码级证据链为主；`.playwright-cli/` 是 playwright-cli 的本地产物目录（可清理）。
- **基础元素默认示例（2026-09-14）**：文本/长文本/图片拖出即有内容——`core/basic-elements.ts` 的 `sample` = `文本示例` / `长文本示例，可输入多行内容` / 图片用内嵌 SVG 占位图常量 `IMAGE_PLACEHOLDER_SRC`（`data:image/svg+xml,...` 纯 ASCII、`#`→`%23`，可替换为真实地址）；与条码（`123456`）/二维码（`https://example.com`）口径一致；**不采用 placeholder 占位方案**（与真实内容无视觉区分、打印端需隔离、导出格式 placeholder 另有语义）。
- **字段示例内容兜底（2026-09-14，⚠️ 当日已按用户要求撤销）**：曾新增 `fieldSampleOf()` 让空 `sample` 回退字段名（文本/长文本/二维码 → `title||label||key`、条码 → `key`），涉及 `constant.ts` + `field-panel.vue`（预览/dragstart 两处）+ `design-canvas.vue`（`||` 兜底）；用户报告卡死并要求撤销后**已全部回退**（基础元素示例保留）。日后若重做可参考两条教训：`??` 兜不住空字符串；预览与落纸两处必须同改（曾漏改预览处）。

## 打印设计页（hiprint）

- 预览弹窗**必须直接 `instance.getHtml()`**，禁止 `getJson()` → 新建 PrintTemplate → `getHtml()` round-trip（内部状态丢失导致预览与画布不一致）；`handlePreview` 先 blur 属性面板 + `nextTick` + `setTimeout(0)` 再取 HTML。
- 三处滚动区用 `NScrollbar`；整页滚动禁用（body 加 `.print-design-no-scroll`）。
- hiprint API：选中事件 `template.getPrintElementSelectEventKey()`；写回 `element.updateOption()`（**禁 `submitOption()`**，会批量改同类型元素）；复杂字段用 `item.createTarget()` 原生 DOM 兜底。
- 决策（2026-09-11）：放弃自定义右侧属性面板，还原原生 `settingContainer: '#Setting'`，混合渲染方案已全部回退；上述 API 事实保留备用。

## 按钮权限

- 角色权限抽屉「操作权限」列；清单 `src/constants/button-permissions.ts`，code 约定 `system:{模块}:{操作}`；状态 `rowButtonChecks`，随 `menuIds` 提交 `buttonCodes`；后端落库/回显待实现。

## 工具链 / 环境

- 只用 **pnpm**，禁止 npm/yarn。
- WebStorm `node-safe-delete-shim` 拦截 vite rm / pnpm install；PowerShell 用 `$env:NODE_OPTIONS=""` 清空后执行。
- i18n 新增键同步 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`。
- **elegant-router 扫描规则（源码级确认）**：`pagePatterns = ["**/index.vue", "**/[[]*[]].vue"]`（仅 index.vue / [param].vue 生成路由），`pageExcludePatterns = ["**/components/**"]`；故 `views/**/modules/` 下任意嵌套 .vue 都安全、不会生成路由。
- **`pnpm gen-route` 现不可用**：`.bin/sa.cmd` shim 被重新生成回指向已删除的 `bin.ts` → `ERR_MODULE_NOT_FOUND`（复发坑）；路由重新生成**改用 `pnpm dev` 触发**（日志出现 `[elegant-router] watcher ready` 即完成）；勿用 `node @sa/scripts/bin.mjs gen-route`（那是交互式「新建路由」向导）。
- 阿里巴巴普惠体子集化：`scripts/font/extract-i18n-charset.mjs` + `pyftsubset`；全局字体覆盖三处（reset.css 的 html、Naive theme-overrides、`--vxe-ui-font-family`）；源 otf 被 gitignore。

## 原则

- **只改用户明确要求的代码**，不顺手动其它文件；不擅自回退用户已认可的方案，回退前先问。
- **造轮子禁区**：通用 UI 必须直接用 Naive UI 组件 + 扩展点接入（custom-request / slot 等），不得从零手写；组件库确实无法覆盖且用户明确同意才自研（且先 brainstorming 写设计）。
- 用户需求不明确时**先回答问题 + 最小演示**，不自动启动长流程 / subagent 拆解实现。
- 任何代码改动前必须先 brainstorming 出设计并与用户确认（AGENTS.md 规则 2）；讨论记录必须写 `changelog/` 并更新 AGENTS_CHANGELOG.md 索引（规则 1）。
