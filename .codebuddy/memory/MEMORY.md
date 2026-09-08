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
- 预览弹窗高度自适应 iframe 内容，`scrolling="no"`。

## 原则

- 不要擅自回退用户已认可的方案；回退前必须先问用户。
