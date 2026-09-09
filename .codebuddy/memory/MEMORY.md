# MEMORY

## 语言偏好（最高优先级）

- 用户要求**所有内容一律中文**（设计文档、讨论记录、代码注释、commit 说明），**覆盖** AGENTS.md「注释用英文 JSDoc」。库 API / 变量名 / 技术名词保留英文。

## 状态字段

- `Api.Common.EnableStatus = 0 | 1`（number）。`1` 启用 / `0` 禁用（2026-09-03 由字符串全局改造）。
- `NSwitch` 绑数字必须显式 `checkedValue:1`/`uncheckedValue:0`；`status` 列 `activeValue` 必须是 number `1`。
- `FormWrap` 必填规则改为仅 `null/undefined/''` 算空，数字 0/1 不误判。

## 通用 Table（`src/components/Table`）

- loading 用 vxe 原生；`:column-config="{ resizable: true }"`；`show-overflow="tooltip"`。
- 搜索栏由 `SearchBar/search-bar.vue` 渲染；折叠动画只动 opacity+translateY，收起用 `display:none`。
- detail 列复制图标：单元格内兄弟节点，hover 整行显形；颜色跟随主题色。
- **表头高度 = 35px 的修复已整体放弃**：用户经多轮验证（prop `header-cell-config`、全局 `VxeUI.setConfig`、`scrollbar.css` 表头规则、`headerCellStyle`/`headerRowStyle` 等）仍无法让主表区与固定列表头完全对齐，最终明确要求「把对表头的修改去掉」。`table.vue`、`field-select-dialog.vue`、`vxe-table.ts` 中的表头高度相关覆盖均已回退，保留 vxe-table 默认表头行为。

## 导出体系

- 两套并存：右上原生 `action-export` + 左侧 `TableExportAction`（exceljs）。
- `typings/components.d.ts` 自动生成，已登记组件不能直接删，先保留 alias 文件。
- 数据范围：`fetchAll`/`data`/`checkedData`；`ExportScope`、`ExportConfirmPayload` 在 `Export/type.ts`。

## vxe-table 树表

- `tree-config` 必须显式 `rowField`；`treeNode: true` 列不可被用户隐藏。
- 菜单管理页：DEV mock 返回扁平 + parentId；生产返回嵌套 children。

## 系统设置页

- `system-manage_setting` 单菜单，页面内 `NTabs` 切子模块；子组件放 `setting/modules/*.vue`，**不是路由**。
- MasterDetail 右侧容器固定高度 `overflow-hidden`，各页卡片自己内滚；`flex:1` 不等于 `flex-auto`。

## 按钮权限

- 角色权限抽屉每行加「操作权限」列；清单在 `src/constants/button-permissions.ts`，code 约定 `system:{模块}:{操作}`。
- 状态存 `rowButtonChecks`，提交随 `menuIds` 带 `buttonCodes`；后端落库/回显待实现。

## 工具链 / 环境

- 只用 **pnpm**，禁止 npm/yarn。
- WebStorm `coding-copilot` 的 `node-safe-delete-shim` 会拦截 vite `rm` 与 `pnpm install`；PowerShell 下用 `$env:NODE_OPTIONS=""` 清空后执行。
- i18n 新增键同步 `zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`。
- `pnpm release` 用 bumpp 函数式 execute，先 `pnpm sa changelog` 再 `pnpm fmt`。

## 字体

- 阿里巴巴普惠体子集化：`scripts/font/extract-i18n-charset.mjs` + `pyftsubset` 生成 `AlibabaPuHuiTi-subset.woff2`。
- 全局字体覆盖三处：`reset.css` 的 `html`、Naive `theme-overrides`、`html:root` 的 `--vxe-ui-font-family`。
- 源 otf 被 gitignore，他人 clone 需自备。

## vxe-table 滚动条

- 真实滚动条在 `.vxe-table--scroll-y-handle` / `.vxe-table--scroll-x-handle`（原生滚动），不是 body wrapper。
- 样式化要打这两个 handle：用 `opacity` 控制显隐，hover 表格才出现；标准属性 `scrollbar-width: thin` + `scrollbar-color`，伪元素仅作兜底。
- 滚动条区域改 `position:absolute` 浮动；隐藏装饰线与四角；handle 尺寸压到 8px。
- `height:'100%'` 时给根加 `h-full` 锚点的方案（`render/layout/body wrapper 100% + flex` 铺主体）曾用于解决底部留白与固定列错位，但会引起固定列与主表区表头高度不一致（49px vs 48px）。用户已选择回退该方案，删除 `scrollbar.css` 1.5–1.7 节，恢复 vxe-table 默认布局。
- 竖向撑满改用更轻的组件层修复：`Table.vue` 中包裹 `<vxe-table>` 的容器在 `height==='100%'` 时同时加 `flex-1 h-full`，避免父级不是 flex 容器时 `flex-1` 失效导致表格按内容收缩。不再覆盖 vxe-table 内部 wrapper。
- CSS 由 `src/plugins/vxe-table.ts` 运行时注入到 `head` 末尾，保证覆盖 vxe 自带样式。
- vxe-table 根节点 `.vxe-table` 默认带 4px 内边距，会让 `render-wrapper` 比容器矮 8px；如需要完全贴满容器，需在覆盖样式中显式 `padding: 0`。
- 即使 padding 为 0，vxe-table JS 仍可能把 `.vxe-table--render-wrapper` 的 `height` 内联写死为父容器 - 8px，此时需要额外加 `height: 100% !important` 强制覆盖。
- vxe-table 还会按 `scrollbarConfig.height` 在 body 高度里预留横向滚动条轨道（默认 8px），导致底部留白；将其设为 `0`，handle 仍由 `scrollbar.css` 的 `height:8px !important` 强制渲染（浮动覆盖、不占布局）。

## 打印设计页

- 三处滚动区用 `NScrollbar`；整页滚动禁用（`body` 加 `.print-design-no-scroll`）。
- 预览弹窗**必须直接用设计器实例 `instance.getHtml()` 生成 HTML**，禁止走 `getJson()` → 新建 `PrintTemplate` → `getHtml()` 的 round-trip 路径。hiprint 的 JSON 序列化/反序列化不保留完整内部状态（元素位置、缩放坐标等），会导致预览与画布不一致（补 `dataMode: 1` / `setPaper()` 均无效）。设计态 UI 通过预览文档内 CSS 隐藏。
- `handlePreview` 改为 async，生成前先 `(document.activeElement)?.blur()` 强制提交属性面板改动，再 `await nextTick()` + `setTimeout(0)` 等模型/画布同步后再 `getHtml()`，否则预览不显示最新编辑。
- 预览弹窗尺寸：NModal 用 `width:auto + maxWidth:95vw`；iframe 由 JS 读内部 `.hiprint-printPaper` 的 `getBoundingClientRect()` 实际尺寸设置 width/height，不再用 `w-full`。

## 原则

- 不要擅自回退用户已认可的方案；回退前必须先问用户。
- **造轮子禁区（2026-09-09 重大教训）**：通用 UI / 表单 / 上传 / 选择器等**必须直接用组件库**（本仓库 Naive UI：`NUpload` / `NUploadDragger` / `NForm` / `NInput` / `NSelect` / `NDatePicker` / `NDataTable` 等），**不得从零手写**同名组件。组件库不满足的"上传逻辑 / 校验 / 数据流"等通过组件库**扩展点**（`custom-request` / `on-change` / `on-before-upload` / slot / `list-type` / 具名插槽 等）接入，而不是另造一套。即使上级任务里没明说"用组件库"，**默认按"用组件库 + 扩展点接入"实现**；只有组件库确实无法覆盖、用户**明确同意**时才考虑自研（且应先 brainstorming 写设计文档）。触发场景：上传（这次完全多余地写了 `use-upload` / `hash-worker` / `upload.vue` / `upload-cropper.vue` / `spark-md5` / `cropperjs` 全删）、表格（直接用 `NDataTable` 或现有 Table）、下拉/选择（用 `NSelect` / `NTreeSelect`）等。
- **不要自动 subagent 启动长流程**：用户给一个不明确的需求时（"上传图片怎么显示"），**先回答问题 + 给最小演示**，不要自作主张启动 `subagent-driven-development` 跑 8 个 Task 拆解实现（这次直接催生了一整套过度造轮子）。规划性流程只应在用户明确要求"做这个功能"时启动。
