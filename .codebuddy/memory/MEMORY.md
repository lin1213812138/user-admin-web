# MEMORY

## 语言偏好（最高优先级）

- 用户要求**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」。库 API / 变量名 / 技术名词保留英文。

## 状态字段 / FormWrap / Naive 通用事实

- `Api.Common.EnableStatus = 0 | 1`（number，1 启用 0 禁用）；NSwitch 绑数字显式 `checkedValue`/`uncheckedValue`；status 列 `activeValue` 用 number `1`。
- FormWrap：必填规则仅 `null/undefined/''` 算空；支持 `size` prop 透传 NForm（小尺寸场景 `size="small"`，属性面板另用 scoped 把 label 压到 12px）。
- naive 输入类组件 value===undefined 走非受控分支（回落实例内部值），跨数据源复用实例会残留旧值并被输入污染；修法：buildModel 对可能缺失的键补受控空值，**兜底放对象展开之后（`??=`）**——展开会拷贝显式 undefined，前置默认值会被吃掉。
- NGrid `cols=24 + x-gap` 硬开销 = 23×gap 与 span 无关；窄容器（<~370px）必须调小 `grid-x-gap`（属性面板用 8）。GridItem 渲染的 div **无 class**，要选中 NGi 写 `:deep(.n-grid > div)`。
- NCollapse `arrow-placement="right"` 箭头贴右：header slot 自身 `flex-1` 撑满。

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

## 标签设计器（label-designer，自研）

- 拖动：高频帧直写 DOM + dragPreview 显示通道，松手一次写 store；**pointerup 必须按 store 权威值回写 left/top/width/height（放 updateElement 之后）**，纯清空会因 Vue 不重渲染导致元素飞到左上角。**禁用 will-change:transform**（合成层栅格化舍入致视觉抖动 1~2px）。
- 属性面板：位置与尺寸 / 数据预览 / 样式 / 删除按钮；**折叠区块定稿模式 = 裸 NCollapse（header `<span class="flex-1">`）+ 每个 item 内容包 `NCard size="small"` 白底描边卡**，左右面板同款，今后加折叠区块照此。
- 标题+内容：**行内连续排版**（inline span 前缀 + 半角冒号、随显隐、间 8px），折行行首顶格；仅非文本元素用水平 flex 左标题右内容；**label 永不上画布**；关联标题 = `FieldDef.showTitle && title` 同时为真（缺省不显示）。
- 数据模型：`DataPreviewExtras`（title/showTitle/placeholder）+ `BorderExtras`（showBorder/borderWidth/borderColor，默认关 1px 黑）挂 text/longText/barcode/qrcode options；画布 `element-renderer.vue` 与打印 `render-element-html.ts` **两处必须同步改**。
- 默认字号统一 8pt（2026-09-12 用户定稿）：store `defaultOptionsFor` 新建默认 text/barcode `fontSize` 与各 `titleFontSize` 均 8，渲染层缺省回退（`??8`/`||8`）与两端同步；用户嫌之前的 12/10 太大。
- **几何单位定稿（2026-09-12）**：元素 x/y/width/height 全链路 **pt**（属性面板/存储/画布/打印），**纸张保留 mm**；`LabelTemplate.unit` 缺省视为 mm 自动迁移 ×PT_PER_MM，toJson 写 'pt'；换算常量在 constant.ts（`PX_PER_PT`/`PT_PER_MM`/`mmToPt`）。字号 pt、边框/行距 px、纸张 mm、几何 pt——四类单位并存。
- `resolveDisplayText` 回退链：示例内容 → placeholder → `{{field}}`。
- 业务字段拖入类型由 `FieldDef.elementType` 决定（缺省 text），映射表在 design-canvas.vue `FIELD_TYPE_LABEL_KEYS`；改默认类型直接改 `BUSINESS_FIELDS`。
- **loadFromJson 不补默认字段，新增 options 字段必须做旧数据兼容**（渲染层 `!== false` 兜底）。bwip-js：数值参数喂 NaN 抛 `invalidOptionType`，可选数值必须 `|| 默认值`；调试用 node `toBuffer` 渲 PNG 即可。
- `fieldTypeDisplay` 是 UI-only key，提交 options 前过滤；同文件多处 replace_in_file 不能并行（后写覆盖先写）。
- 工具栏单行（2026-09-12）：模板选择/撤销重做/纸张/网格/缩放/预览/保存全部在 `tool-bar.vue`（props: templates/currentId/loading，emits: templateChange/save/preview），index.vue 无独立头部行；i18n `labelDesign.title` 成死键未删。
- 保存链路：index.vue `handleSave()` → `fetchSavePrintTemplateDesign({ id, designJson: store.toJson(), paperSize })`；**保存成功后 `previewTemplateJson()` 新标签页预览 JSON**（window.open Blob URL，revokeObjectURL 延迟 60s 防新标签空白；2026-09-12 由下载文件改来，用户要求）。
- **designJson 目标存储格式（2026-09-12 定稿，B 方案）**：顶层 `{ unit:'pt', paper:{width,height,unit:'mm'}, elements }`，元素=`id,type,key,label,x,y,width,height(pt),style,options`；转换全在 `label-designer/modules/export-format.ts`（`toExportTemplate`/`parseTemplateJson`），store 只剩一行调用；loadFromJson 三输入兼容（目标格式 options 优先反推 / 旧原生 mm 自动迁移 pt / 非法回退空模板）；映射 key←field、label←title、hideLabel←!showTitle、style.placeholder←text/value、fontFamily 补 Microsoft YaHei；**内部几何已并行 pt 化（types LabelTemplate.unit?:'mm'|'pt'，缺省 mm 旧数据）**，序列化 pt 直传不换算。

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
- 阿里巴巴普惠体子集化：`scripts/font/extract-i18n-charset.mjs` + `pyftsubset`；全局字体覆盖三处（reset.css 的 html、Naive theme-overrides、`--vxe-ui-font-family`）；源 otf 被 gitignore。

## 原则

- **只改用户明确要求的代码**，不顺手动其它文件；不擅自回退用户已认可的方案，回退前先问。
- **造轮子禁区**：通用 UI 必须直接用 Naive UI 组件 + 扩展点接入（custom-request / slot 等），不得从零手写；组件库确实无法覆盖且用户明确同意才自研（且先 brainstorming 写设计）。
- 用户需求不明确时**先回答问题 + 最小演示**，不自动启动长流程 / subagent 拆解实现。
- 任何代码改动前必须先 brainstorming 出设计并与用户确认（AGENTS.md 规则 2）；讨论记录必须写 `changelog/` 并更新 AGENTS_CHANGELOG.md 索引（规则 1）。
